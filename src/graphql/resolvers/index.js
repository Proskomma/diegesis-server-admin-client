import path from 'path';
import fse from 'fs-extra';
import appRootPath from "app-root-path";
const appRoot = appRootPath.toString();

const orgHandlers = {};
for (const org of fse.readdirSync(path.resolve(appRoot, 'src', 'orgHandlers'))) {
    const translations = await import(path.resolve(appRoot, 'src', 'orgHandlers', org, 'translations.js'));
    orgHandlers[org] = {
        getTranslationsCatalog: translations.getTranslationsCatalog,
        fetchUsfm: translations.fetchUsfm,
    }
}

const orgsData = {};
for (const org of Object.keys(orgHandlers)) {
    const orgRecord = fse.readJsonSync(path.resolve(appRoot, 'src', 'orgHandlers', org, 'org.json'));
    orgsData[org] = {
        id: org,
        name: orgRecord.name,
        translationDir: orgRecord.translationDir,
        translations: await orgHandlers[org].getTranslationsCatalog(),
    };
}

const usfmDir =
    (translationDir, translationId) =>
        path.resolve(
            appRoot,
            'data',
            translationDir,
            'translations',
            translationId,
            'usfmBooks'
        );

export default ({
    Query: {
        orgs: () => Object.values(orgsData),
        org: (root, args) => orgsData[args.name],
    },
    Org: {
        nTranslations: (org) => org.translations.length,
        translations: (org, args, context) => {
            context.orgData = org;
            context.orgHandler = orgHandlers[org.id];
            return org.translations;
        },
        translation: (org, args, context) => {
            context.orgData = org;
            context.orgHandler = orgHandlers[org.id];
            return org.translations.filter(t => t.id === args.id)[0];
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
        fetchUsx: (root, args) => true,
    }
});
