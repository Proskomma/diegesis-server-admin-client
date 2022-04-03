import path from 'path';
import fse from 'fs-extra';
import {GraphQLScalarType, Kind} from 'graphql';

import appRootPath from "app-root-path";

const appRoot = appRootPath.toString();

const makeResolvers = async (orgs) => {
    const orgHandlers = {};
    const orgsData = {};
    console.log("Diegesis Server");
    console.log("  Loading org handlers");
    let loadedSomething = false;
    for (const orgDir of fse.readdirSync(path.resolve(appRoot, 'src', 'orgHandlers'))) {
        const orgRecord = fse.readJsonSync(path.resolve(appRoot, 'src', 'orgHandlers', orgDir, 'org.json'));
        if (orgs.length > 0 && !orgs.includes(orgRecord.name)) {
            continue;
        }
        console.log(`    ${orgRecord.name}`);
        const translations = await import(path.resolve(appRoot, 'src', 'orgHandlers', orgDir, 'translations.js'));
        orgHandlers[orgRecord.name] = {
            getTranslationsCatalog: translations.getTranslationsCatalog,
            fetchUsfm: translations.fetchUsfm,
            fetchUsx: translations.fetchUsx,
        };
        orgsData[orgRecord.name] = {
            orgDir: orgDir,
            name: orgRecord.name,
            translationDir: orgRecord.translationDir,
            translations: await orgHandlers[orgRecord.name].getTranslationsCatalog(),
        };
        loadedSomething = true;
    }
    if (!loadedSomething) {
        console.log('Error: no org handlers loaded: check or remove orgs array in config file');
        process.exit(1);
    }

    const transPath =
        (translationDir, translationId) =>
            path.resolve(
                appRoot,
                'data',
                translationDir,
                'translations',
                translationId,
            );

    const usfmDir =
        (translationDir, translationId) =>
            path.join(
                transPath(translationDir, translationId),
                'usfmBooks'
            );

    const usxDir =
        (translationDir, translationId) =>
            path.join(
                transPath(translationDir, translationId),
                'usxBooks'
            );

    const scalarRegexes = {
        OrgName: new RegExp(/^[A-Za-z0-9]{2,64}$/),
        TranslationId: new RegExp(/^[A-Za-z0-9_-]{1,64}$/),
        BookCode: new RegExp(/^[A-Z0-9]{3}$/),
    }

    const orgNameScalar = new GraphQLScalarType({
        name: 'OrgName',
        description: 'Name of a data source',
        serialize(value) {
            if (typeof value !== 'string') {
                return null;
            }
            if (!scalarRegexes.OrgName.test(value)) {
                return null;
            }
            return value;
        },
        parseValue(value) {
            return value;
        },
        parseLiteral(ast) {
            if (ast.kind !== Kind.STRING) {
                throw new Error(`Must be a string, not ${ast.kind}`);
            }
            if (!scalarRegexes.OrgName.test(ast.value)) {
                throw new Error(`One or more characters is not allowed`);
            }
            return ast.value
        },
    });

    const translationIdScalar = new GraphQLScalarType({
        name: 'TranslationId',
        description: 'Identifier for a translation',
        serialize(value) {
            if (typeof value !== 'string') {
                return null;
            }
            if (!scalarRegexes.TranslationId.test(value)) {
                return null;
            }
            return value;
        },
        parseValue(value) {
            return value;
        },
        parseLiteral(ast) {
            if (ast.kind !== Kind.STRING) {
                throw new Error(`Must be a string, not ${ast.kind}`);
            }
            if (!scalarRegexes.TranslationId.test(ast.value)) {
                throw new Error(`One or more characters is not allowed`);
            }
            return ast.value
        },
    });

    const bookCodeScalar = new GraphQLScalarType({
        name: 'BookCode',
        description: 'Paratext-like code for a Scripture book',
        serialize(value) {
            if (typeof value !== 'string') {
                return null;
            }
            if (!scalarRegexes.BookCode.test(value)) {
                return null;
            }
            return value;
        },
        parseValue(value) {
            return value;
        },
        parseLiteral(ast) {
            if (ast.kind !== Kind.STRING) {
                throw new Error(`Must be a string, not ${ast.kind}`);
            }
            if (!scalarRegexes.BookCode.test(ast.value)) {
                throw new Error(`One or more characters is not allowed`);
            }
            return ast.value
        },
    });

    const filteredCatalog= (org, args, context, translations) => {
        context.orgData = org;
        context.orgHandler = orgHandlers[org.name];
        let ret = translations;
        if (args.withId) {
            ret = ret.filter(t => args.withId.includes(t.id));
        }
        if (args.withLanguageCode) {
            ret = ret.filter(t => args.withLanguageCode.includes(t.languageCode));
        }
        if (args.withMatchingMetadata) {
            ret = ret.filter(
                t =>
                    t.title.includes(args.withMatchingMetadata) ||
                    t.description.includes(args.withMatchingMetadata)
            );
        }
        if (args.sortedBy) {
            if (!['id', 'languageCode', 'languageName', 'title'].includes(args.sortedBy)) {
                throw new Error(`Invalid sortedBy option '${args.sortedBy}'`);
            }
            ret.sort(function (a, b) {
                const lca = a[args.sortedBy].toLowerCase();
                const lcb = b[args.sortedBy].toLowerCase();
                if (lca > lcb) {
                    return args.reverse ? -1 : 1;
                } else if (lcb > lca) {
                    return args.reverse ? 1 : -1;
                } else {
                    return 0;
                }
            });
        }
        if ('withUsfm' in args) {
            if (args.withUsfm) {
                ret = ret.filter(t => fse.pathExistsSync(usfmDir(context.orgData.translationDir, t.id)));
            } else {
                ret = ret.filter(t => !fse.pathExistsSync(usfmDir(context.orgData.translationDir, t.id)));
            }
        }
        if ('withUsx' in args) {
            if (args.withUsx) {
                ret = ret.filter(t => fse.pathExistsSync(usxDir(context.orgData.translationDir, t.id)));
            } else {
                ret = ret.filter(t => !fse.pathExistsSync(usxDir(context.orgData.translationDir, t.id)));
            }
        }
        return ret;
    }

    return {
        OrgName: orgNameScalar,
        TranslationId: translationIdScalar,
        BookCode: bookCodeScalar,
        Query: {
            orgs: () => Object.values(orgsData),
            org: (root, args) => orgsData[args.name],
        },
        Org: {
            nCatalogEntries: org => org.translations.length,
            nLocalTranslations: (org, args, context) => {
                let ret = org.translations.filter(t => fse.pathExistsSync(transPath(org.orgDir, t.id)));
                if (args.withUsfm) {
                    ret = ret.filter(t => fse.pathExistsSync(usfmDir(org.orgDir, t.id)));
                }
                if (args.withUsx) {
                    ret = ret.filter(t => fse.pathExistsSync(usxDir(org.orgDir, t.id)));
                }
                return ret.length;
            },
            catalogEntries: (org, args, context) => {
                 return filteredCatalog(org, args, context, org.translations);
            },
            localTranslations: (org, args, context) => {
                return filteredCatalog(org, args, context, org.translations.filter(t => fse.pathExistsSync(transPath(org.orgDir, t.id))));
            },
            catalogEntry: (org, args, context) => {
                context.orgData = org;
                context.orgHandler = orgHandlers[org.name];
                return org.translations
                    .filter(t => t.id === args.id)[0];
            },
            localTranslation: (org, args, context) => {
                context.orgData = org;
                context.orgHandler = orgHandlers[org.name];
                return org.translations
                    .filter(t => fse.pathExistsSync(transPath(org.orgDir, t.id)))
                    .filter(t => t.id === args.id)[0];
            },
        },
        CatalogEntry: {
            hasLocalUsfm: (trans, args, context) => {
                const usfmDirPath = usfmDir(context.orgData.translationDir, trans.id);
                return fse.pathExistsSync(usfmDirPath);
            },
            hasLocalUsx: (trans, args, context) => {
                const usxDirPath = usxDir(context.orgData.translationDir, trans.id);
                return fse.pathExistsSync(usxDirPath);
            },
        },
        Translation: {
            nUsfmBooks: (trans, args, context) => {
                const usfmDirPath = usfmDir(context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(usfmDirPath)) {
                    return fse.readdirSync(usfmDirPath).length;
                } else {
                    return 0;
                }
            },
            usfmBookCodes: (trans, args, context) => {
                const usfmDirPath = usfmDir(context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(usfmDirPath)) {
                    return fse.readdirSync(usfmDirPath).map(p => p.split('.')[0]);
                } else {
                    return [];
                }
            },
            hasUsfmBookCode: (trans, args, context) => {
                const usfmDirPath = usfmDir(context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(usfmDirPath)) {
                    return fse.readdirSync(usfmDirPath).map(p => p.split('.')[0]).includes(args.code);
                } else {
                    return false;
                }
            },
            hasUsfm: (trans, args, context) => {
                const usfmDirPath = usfmDir(context.orgData.translationDir, trans.id);
                return fse.pathExistsSync(usfmDirPath);
            },
            usfmForBookCode: (trans, args, context) => {
                const usfmDirPath = usfmDir(context.orgData.translationDir, trans.id);
                const bookPath = path.join(usfmDirPath, `${args.code}.usfm`);
                if (fse.pathExistsSync(bookPath)) {
                    return fse.readFileSync(bookPath).toString();
                } else {
                    return null;
                }
            },
            nUsxBooks: (trans, args, context) => {
                const usxDirPath = usxDir(context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(usxDirPath)) {
                    return fse.readdirSync(usxDirPath).length;
                } else {
                    return 0;
                }
            },
            usxBookCodes: (trans, args, context) => {
                const usxDirPath = usxDir(context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(usxDirPath)) {
                    return fse.readdirSync(usxDirPath).map(p => p.split('.')[0]);
                } else {
                    return [];
                }
            },
            hasUsxBookCode: (trans, args, context) => {
                const usxDirPath = usxDir(context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(usxDirPath)) {
                    return fse.readdirSync(usxDirPath).map(p => p.split('.')[0]).includes(args.code);
                } else {
                    return false;
                }
            },
            hasUsx: (trans, args, context) => {
                const usxDirPath = usxDir(context.orgData.translationDir, trans.id);
                return fse.pathExistsSync(usxDirPath);
            },
            usxForBookCode: (trans, args, context) => {
                const usxDirPath = usxDir(context.orgData.translationDir, trans.id);
                const bookPath = path.join(usxDirPath, `${args.code}.usx`);
                if (fse.pathExistsSync(bookPath)) {
                    return fse.readFileSync(bookPath).toString();
                } else {
                    return null;
                }
            },
        },
        Mutation: {
            fetchUsfm: async (root, args) => {
                const orgOb = orgsData[args.org];
                if (!orgOb) {
                    return false;
                }
                const transOb = orgOb.translations.filter(t => t.id === args.translationId)[0];
                if (!transOb) {
                    return false;
                }
                try {
                    await orgHandlers[args.org].fetchUsfm(orgOb, transOb);
                    return true;
                } catch (err) {
                    throw new Error(err);
                    return false;
                }
            },
            fetchUsx: async (root, args) => {
                const orgOb = orgsData[args.org];
                if (!orgOb) {
                    return false;
                }
                const transOb = orgOb.translations.filter(t => t.id === args.translationId)[0];
                if (!transOb) {
                    return false;
                }
                try {
                    await orgHandlers[args.org].fetchUsx(orgOb, transOb);
                    return true;
                } catch (err) {
                    throw new Error(err);
                    return false;
                }
            },
        },
    };
};

export default makeResolvers;
