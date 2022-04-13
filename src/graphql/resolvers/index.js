const path = require('path');
const fse = require('fs-extra');
const {GraphQLScalarType, Kind} = require('graphql');
const {transPath, usfmDir, usxDir, succinctPath, succinctErrorPath, vrsPath} = require('../../lib/dataPaths');
const makeSuccinct = require('../../lib/makeSuccinct');
const appRootPath = require("app-root-path");

const appRoot = appRootPath.toString();

const makeResolvers = async (config) => {
    const orgHandlers = {};
    const orgsData = {};
    config.verbose && console.log("Diegesis Server");
    config.verbose && console.log("  Loading org handlers");
    let loadedSomething = false;
    for (const orgDir of fse.readdirSync(path.resolve(appRoot, 'src', 'orgHandlers'))) {
        const orgRecord = fse.readJsonSync(path.resolve(appRoot, 'src', 'orgHandlers', orgDir, 'org.json'));
        if (config.orgs.length > 0 && !config.orgs.includes(orgRecord.name)) {
            continue;
        }
        config.verbose && console.log(`    ${orgRecord.name}`);
        const translations = require(path.resolve(appRoot, 'src', 'orgHandlers', orgDir, 'translations.js'));
        orgHandlers[orgRecord.name] = {
            getTranslationsCatalog: translations.getTranslationsCatalog,
            fetchUsfm: translations.fetchUsfm,
            fetchUsx: translations.fetchUsx,
        };
        orgsData[orgRecord.name] = {
            orgDir: orgDir,
            name: orgRecord.name,
            fullName: orgRecord.fullName,
            contentType: orgRecord.contentType,
            translationDir: orgRecord.translationDir,
            translations: await orgHandlers[orgRecord.name].getTranslationsCatalog(),
        };
        loadedSomething = true;
    }
    if (!loadedSomething) {
        console.log('Error: no org handlers loaded: check or remove orgs array in config file');
        process.exit(1);
    }

    const scalarRegexes = {
        OrgName: new RegExp(/^[A-Za-z0-9]{2,64}$/),
        TranslationId: new RegExp(/^[A-Za-z0-9_-]{1,64}$/),
        BookCode: new RegExp(/^[A-Z0-9]{3}$/),
        ContentType: new RegExp(/^(USFM|USX)$/),
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

    const ContentTypeScalar = new GraphQLScalarType({
        name: 'ContentType',
        description: 'The type of content returned by an organization',
        serialize(value) {
            if (typeof value !== 'string') {
                return null;
            }
            if (!scalarRegexes.ContentType.test(value)) {
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
            if (!scalarRegexes.ContentType.test(ast.value)) {
                throw new Error(`Expected USFM or USX`);
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

    const filteredCatalog = (org, args, context, translations) => {
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
                    args.withMatchingMetadata.filter(
                        md => t.title.toLowerCase().includes(md.toLowerCase())
            ).length > 0
            )
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
                ret = ret.filter(t => fse.pathExistsSync(usfmDir(config.dataPath, context.orgData.translationDir, t.id)));
            } else {
                ret = ret.filter(t => !fse.pathExistsSync(usfmDir(config.dataPath, context.orgData.translationDir, t.id)));
            }
        }
        if ('withUsx' in args) {
            if (args.withUsx) {
                ret = ret.filter(t => fse.pathExistsSync(usxDir(config.dataPath, context.orgData.translationDir, t.id)));
            } else {
                ret = ret.filter(t => !fse.pathExistsSync(usxDir(config.dataPath, context.orgData.translationDir, t.id)));
            }
        }
        if ('withSuccinct' in args) {
            if (args.withSuccinct) {
                ret = ret.filter(t => fse.pathExistsSync(succinctPath(config.dataPath, context.orgData.translationDir, t.id)));
            } else {
                ret = ret.filter(t => !fse.pathExistsSync(succinctPath(config.dataPath, context.orgData.translationDir, t.id)));
            }
        }
        if ('withSuccinctError' in args) {
            if (args.withSuccinctError) {
                ret = ret.filter(t => fse.pathExistsSync(succinctErrorPath(config.dataPath, context.orgData.translationDir, t.id)));
            } else {
                ret = ret.filter(t => !fse.pathExistsSync(succinctErrorPath(config.dataPath, context.orgData.translationDir, t.id)));
            }
        }
        return ret;
    }

    const scalarResolvers = {
        OrgName: orgNameScalar,
        TranslationId: translationIdScalar,
        BookCode: bookCodeScalar,
        ContentType: ContentTypeScalar,
    }
    const queryResolver = {
        Query: {
            orgs: (root, args, context) => {
                return Object.values(orgsData);
            },
            org: (root, args, context) => {
                context.incidentLogger = config.incidentLogger;
                return orgsData[args.name];
            },
        },
        Org: {
            nCatalogEntries: org => org.translations.length,
            nLocalTranslations: (org, args, context) => {
                let ret = org.translations.filter(t => fse.pathExistsSync(transPath(config.dataPath, org.translationDir, t.id)));
                if (args.withUsfm) {
                    ret = ret.filter(t => fse.pathExistsSync(usfmDir(config.dataPath, org.translationDir, t.id)));
                }
                if (args.withUsx) {
                    ret = ret.filter(t => fse.pathExistsSync(usxDir(config.dataPath, org.translationDir, t.id)));
                }
                return ret.length;
            },
            catalogEntries: (org, args, context) => {
                return filteredCatalog(org, args, context, org.translations);
            },
            localTranslations: (org, args, context) => {
                return filteredCatalog(
                    org,
                    args,
                    context,
                    org.translations
                        .filter(t => fse.pathExistsSync(transPath(config.dataPath, org.translationDir, t.id)))
                ).map(
                    t => fse.readJsonSync(
                        path.join(
                            transPath(config.dataPath, org.translationDir, t.id),
                            'metadata.json'
                        )
                    ));
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
                const trans = org.translations
                    .filter(t => fse.pathExistsSync(transPath(config.dataPath, org.translationDir, t.id)))
                    .filter(t => t.id === args.id)[0];
                if (trans) {
                    return fse.readJsonSync(
                        path.join(
                            transPath(config.dataPath, org.translationDir, trans.id),
                            'metadata.json'
                        )
                    );
                } else {
                    return null;
                }
            },
        },
        CatalogEntry: {
            hasLocalUsfm: (trans, args, context) => {
                const usfmDirPath = usfmDir(config.dataPath, context.orgData.translationDir, trans.id);
                return fse.pathExistsSync(usfmDirPath);
            },
            hasLocalUsx: (trans, args, context) => {
                const usxDirPath = usxDir(config.dataPath, context.orgData.translationDir, trans.id);
                return fse.pathExistsSync(usxDirPath);
            },
            hasLocalSuccinct: (trans, args, context) => {
                const succinctP = succinctPath(config.dataPath, context.orgData.translationDir, trans.id);
                return fse.pathExistsSync(succinctP);
            },
        },
        Translation: {
            nUsfmBooks: (trans, args, context) => {
                const usfmDirPath = usfmDir(config.dataPath, context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(usfmDirPath)) {
                    return fse.readdirSync(usfmDirPath).length;
                } else {
                    return 0;
                }
            },
            usfmBookCodes: (trans, args, context) => {
                const usfmDirPath = usfmDir(config.dataPath, context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(usfmDirPath)) {
                    return fse.readdirSync(usfmDirPath).map(p => p.split('.')[0]);
                } else {
                    return [];
                }
            },
            hasUsfmBookCode: (trans, args, context) => {
                const usfmDirPath = usfmDir(config.dataPath, context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(usfmDirPath)) {
                    return fse.readdirSync(usfmDirPath).map(p => p.split('.')[0]).includes(args.code);
                } else {
                    return false;
                }
            },
            hasUsfm: (trans, args, context) => {
                const usfmDirPath = usfmDir(config.dataPath, context.orgData.translationDir, trans.id);
                return fse.pathExistsSync(usfmDirPath);
            },
            usfmForBookCode: (trans, args, context) => {
                const usfmDirPath = usfmDir(config.dataPath, context.orgData.translationDir, trans.id);
                const bookPath = path.join(usfmDirPath, `${args.code}.usfm`);
                if (fse.pathExistsSync(bookPath)) {
                    return fse.readFileSync(bookPath).toString();
                } else {
                    return null;
                }
            },
            nUsxBooks: (trans, args, context) => {
                const usxDirPath = usxDir(config.dataPath, context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(usxDirPath)) {
                    return fse.readdirSync(usxDirPath).length;
                } else {
                    return 0;
                }
            },
            usxBookCodes: (trans, args, context) => {
                const usxDirPath = usxDir(config.dataPath, context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(usxDirPath)) {
                    return fse.readdirSync(usxDirPath).map(p => p.split('.')[0]);
                } else {
                    return [];
                }
            },
            hasUsxBookCode: (trans, args, context) => {
                const usxDirPath = usxDir(config.dataPath, context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(usxDirPath)) {
                    return fse.readdirSync(usxDirPath).map(p => p.split('.')[0]).includes(args.code);
                } else {
                    return false;
                }
            },
            hasUsx: (trans, args, context) => {
                const usxDirPath = usxDir(config.dataPath, context.orgData.translationDir, trans.id);
                return fse.pathExistsSync(usxDirPath);
            },
            usxForBookCode: (trans, args, context) => {
                const usxDirPath = usxDir(config.dataPath, context.orgData.translationDir, trans.id);
                const bookPath = path.join(usxDirPath, `${args.code}.usx`);
                if (fse.pathExistsSync(bookPath)) {
                    return fse.readFileSync(bookPath).toString();
                } else {
                    return null;
                }
            },
            hasSuccinct: (trans, args, context) => {
                const succinctP = succinctPath(config.dataPath, context.orgData.translationDir, trans.id);
                return fse.pathExistsSync(succinctP);
            },
            succinct: (trans, args, context) => {
                const succinctP = succinctPath(config.dataPath, context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(succinctP)) {
                    return fse.readFileSync(succinctP).toString();
                }
                return null;
            },
            hasSuccinctError: (trans, args, context) => {
                const succinctEP = succinctErrorPath(config.dataPath, context.orgData.translationDir, trans.id);
                return fse.pathExistsSync(succinctEP);
            },
            succinctError: (trans, args, context) => {
                const succinctEP = succinctErrorPath(config.dataPath, context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(succinctEP)) {
                    return fse.readFileSync(succinctEP).toString();
                }
                return null;
            },
            hasVrs: (trans, args, context) => {
                const vrsP = vrsPath(config.dataPath, context.orgData.translationDir, trans.id);
                return fse.pathExistsSync(vrsP);
            },
            vrs: (trans, args, context) => {
                const vrsP = vrsPath(config.dataPath, context.orgData.translationDir, trans.id);
                if (fse.pathExistsSync(vrsP)) {
                    return fse.readFileSync(vrsP).toString();
                }
                return null;
            },
        }
    };
    const mutationResolver = {
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
                    await orgHandlers[args.org].fetchUsfm(orgOb, transOb, config);
                    const succinctP = succinctPath(config.dataPath, orgOb.translationDir, transOb.id);
                    if (fse.pathExistsSync(succinctP)) {
                        fse.unlinkSync(succinctP);
                    }
                    return true;
                } catch (err) {
                    console.log(err);
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
                    await orgHandlers[args.org].fetchUsx(orgOb, transOb, config);
                    const succinctP = succinctPath(config.dataPath, orgOb.translationDir, transOb.id);
                    if (fse.pathExistsSync(succinctP)) {
                        fse.unlinkSync(succinctP);
                    }
                    return true;
                } catch (err) {
                    console.log(err);
                    return false;
                }
            },
            makeSuccinct: async (root, args) => {
                const orgOb = orgsData[args.org];
                if (!orgOb) {
                    return false;
                }
                const transOb = orgOb.translations.filter(t => t.id === args.translationId)[0];
                if (!transOb) {
                    return false;
                }
                try {
                    const metadata = fse.readJsonSync(
                        path.join(
                            transPath(config.dataPath, orgOb.translationDir, transOb.id),
                            'metadata.json'
                        )
                    );
                    let contentDir = usfmDir(config.dataPath, orgOb.translationDir, transOb.id);
                    let docType = 'usfm';
                    if (!fse.pathExistsSync(contentDir)) {
                        contentDir = usxDir(config.dataPath, orgOb.translationDir, transOb.id);
                        docType = 'usx';
                        if (!fse.pathExistsSync(contentDir)) {
                            throw new Error(`Neither USFM nor USX directory exists for ${orgOb.name}/${transOb.id}`);
                        }
                    }
                    let vrsContent = null;
                    const vrsP = vrsPath(config.dataPath, orgOb.translationDir, transOb.id);
                    if (fse.pathExistsSync(vrsP)) {
                        vrsContent = fse.readFileSync(vrsP).toString();
                    }
                    const succinct = makeSuccinct(
                        orgOb.name,
                        metadata,
                        docType,
                        fse.readdirSync(contentDir).map(f => fse.readFileSync(path.join(contentDir, f)).toString()),
                        vrsContent
                    );
                    fse.writeJsonSync(
                        succinctPath(config.dataPath, orgOb.translationDir, transOb.id),
                        succinct,
                    );
                    return true;
                } catch (err) {
                    console.log(err);
                    return false;
                }
            },
            deleteSuccinctError: async (root, args) => {
                const orgOb = orgsData[args.org];
                if (!orgOb) {
                    return false;
                }
                const transOb = orgOb.translations.filter(t => t.id === args.translationId)[0];
                if (!transOb) {
                    return false;
                }
                const succinctEP = succinctErrorPath(config.dataPath, orgOb.translationDir, transOb.id);
                if (fse.pathExistsSync(succinctEP)) {
                    fse.removeSync(succinctEP);
                    return true;
                } else {
                    return false;
                }
            },
        },
    };

    if (config.includeMutations) {
        return {...scalarResolvers, ...queryResolver, ...mutationResolver};
    } else {
        return {...scalarResolvers, ...queryResolver};
    }
};

module.exports = makeResolvers;
