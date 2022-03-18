import path from 'path';
import fse from 'fs-extra';
import axios from 'axios';
import jszip from 'jszip';
import {ptBookArray} from 'proskomma-utils'

const orgsJson = {};
for (const org of fse.readdirSync(path.resolve('orgHandlers'))) {
    orgsJson[org] = fse.readJsonSync(path.resolve('orgHandlers', org, 'org.json'));
}

const getCatalog = orgPath => fse.readJsonSync(path.resolve('..', 'static', orgPath, 'catalog.json'));

const fetchUsfm = async (org, trans) => {
    const transPath = path.resolve('..', 'static', org.translationDir, 'translations', trans.translationId);
    if (!fse.pathExistsSync(transPath)) {
        fse.mkdirsSync(transPath);
    }
    const axiosInstance = axios.create({});
    axiosInstance.defaults.headers = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
    };
    const downloadResponse = await axiosInstance.request(
        {
            method: "get",
            responseType: 'arraybuffer',
            "url": trans.downloadURL,
            "validateStatus": false,
        }
    );
    if (downloadResponse.status !== 200) {
        throw new Error(`Translation download URL ${trans.downloadURL} returned status ${downloadResponse.status}`);
    }
    fse.writeFileSync(path.join(transPath, 'archive.zip'), downloadResponse.data);
    const usfmBooksPath = path.join(transPath, 'usfmBooks');
    fse.mkdirsSync(usfmBooksPath);
    const zip = new jszip();
    await zip.loadAsync(downloadResponse.data);
    for (const bookName of ptBookArray) {
        const foundFiles = zip.file(new RegExp(`${bookName.code}[^/]*.usfm$`, 'g'));
        if (foundFiles.length === 1) {
            const fileContent = await foundFiles[0].async('text');
            fse.writeFileSync(path.join(usfmBooksPath, `${bookName.code}.usfm`), fileContent);
        }
    }
};

export default ({
    Query: {
        orgs: () => Object.values(orgsJson),
        org: (root, args) => orgsJson[args.name]
    },
    Org: {
        nTranslations: (org) => getCatalog(org.translationDir).length,
        translations: (org, args, context) => {
            context.org = org;
            return getCatalog(org.translationDir);
        },
        translation: (org, args, context) => {
            context.org = org;
            return getCatalog(org.translationDir).filter(t => t.translationId === args.id)[0];
        },
    },
    Translation: {
        id: trans => trans.translationId || '',
        languageCode: trans => trans.languageCode || '',
        languageName: trans => trans.languageName || '',
        title: trans => trans.title || '',
        description: trans => trans.description || '',
        copyright: trans => trans.Copyright || '',
        nUsfmBooks: (trans, args, context) => {
            const usfmDirPath = path.resolve(
                '..',
                'static',
                context.org.translationDir,
                'translations',
                trans.translationId,
                'usfmBooks'
            );
            if (fse.pathExistsSync(usfmDirPath)) {
                return fse.readdirSync(usfmDirPath).length;
            } else {
                return 0;
            }
        },
        usfmBookCodes: (trans, args, context) => {
            const usfmDirPath = path.resolve(
                '..',
                'static',
                context.org.translationDir,
                'translations',
                trans.translationId,
                'usfmBooks'
            );
            if (fse.pathExistsSync(usfmDirPath)) {
                return fse.readdirSync(booksPath).map(p => p.split('.')[0]);
            } else {
                return [];
            }
        },
        hasUsfmBookCode: (trans, args, context) => {
            const usfmDirPath = path.resolve(
                '..',
                'static',
                context.org.translationDir,
                'translations',
                trans.translationId,
                'usfmBooks'
            );
            if (fse.pathExistsSync(usfmDirPath)) {
                return fse.readdirSync(usfmDirPath).map(p => p.split('.')[0]).includes(args.code);
            } else {
                return false;
            }
        },
        hasUsfm: (trans, args, context) => {
            const usfmDirPath = path.resolve(
                '..',
                'static',
                context.org.translationDir,
                'translations',
                trans.translationId,
                'usfmBooks'
            );
            return fse.pathExistsSync(usfmDirPath);
        },
        usfmForBookCode: (trans, args, context) => {
            const bookPath = path.resolve(
                '..',
                'static',
                context.org.translationDir,
                'translations',
                trans.translationId,
                'usfmBooks',
                `${args.code}.usfm`
            );
            if (fse.pathExistsSync(bookPath)) {
                return fse.readFileSync(bookPath).toString();
            } else {
                return null;
            }
        },
    },
    Mutation: {
        fetchUsfm: async (root, args) => {
            const orgOb = orgsJson[args.org];
            if (!orgOb) {
                return false;
            }
            const transOb = getCatalog(orgOb.translationDir).filter(t => t.translationId === args.translationId)[0];
            if (!transOb) {
                return false;
            }
            try {
                await fetchUsfm(orgOb, transOb);
                return true;
            } catch (err) {
                console.log(err);
                return false;
            }
        },
        fetchUsx: (root, args) => true,
    }
});
