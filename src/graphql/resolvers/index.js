import path from 'path';
import fse from 'fs-extra';
import axios from 'axios';
import jszip from 'jszip';
import { ptBookArray } from 'proskomma-utils'

const orgsJson = fse.readJsonSync(path.resolve('..', 'static', 'orgs.json'));

const getCatalog = orgPath => fse.readJsonSync(path.resolve('..', 'static', orgPath, 'catalog.json'));

const maybeFetchUsfm = async (org, trans) => {
    const transPath = path.resolve('..', 'static', org.translationDir, 'translations', trans.translationId);
    if (!fse.pathExistsSync(transPath)) {
        fse.mkdirsSync(transPath);
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
    }
};

export default ({
    Query: {
        orgs: () => Object.values(orgsJson),
        org: (root, args) => orgsJson[args.name]
    },
    Org: {
        nCatalogEntries: (org) => getCatalog(org.translationDir).length,
        catalogEntries: (org, args, context) => {
            context.org = org;
            return getCatalog(org.translationDir);
        },
        translationContent: async (org, args, context) => {
            context.org = org;
            const trans = getCatalog(org.translationDir).filter(t => t.translationId === args.id)[0];
            if (!trans) {
                return null;
            }
            context.trans = trans;
            await maybeFetchUsfm(context.org, trans);
            return trans;
        },
    },
    TranslationCatalogEntry: {
        id: trans => trans.translationId || '',
        languageCode: trans => trans.languageCode || '',
        languageLocalName: trans => trans.languageName || '',
        languageEnglishName: trans => trans.languageNameinEnglish || '',
        longTitle: trans => trans.title || '',
        shortTitle: trans => trans.shortTitle || '',
        description: trans => trans.description || '',
        copyright: trans => trans.Copyright || '',
    },
    TranslationContent: {
        nScriptureBooks: (trans, args, context) => {
            const booksPath = path.resolve(
                '..',
                'static',
                context.org.translationDir,
                'translations',
                trans.translationId,
                'usfmBooks'
            );
            if (fse.pathExistsSync(booksPath)) {
                return fse.readdirSync(booksPath).length;
            } else {
                return 0;
            }
        },
        bookCodes: (trans, args, context) => {
            const booksPath = path.resolve(
                '..',
                'static',
                context.org.translationDir,
                'translations',
                trans.translationId,
                'usfmBooks'
            );
            if (fse.pathExistsSync(booksPath)) {
                return fse.readdirSync(booksPath).map(p => p.split('.')[0]);
            } else {
                return [];
            }
        },
        hasBookCode: (trans, args, context) => {
            const booksPath = path.resolve(
                '..',
                'static',
                context.org.translationDir,
                'translations',
                trans.translationId,
                'usfmBooks'
            );
            if (fse.pathExistsSync(booksPath)) {
                return fse.readdirSync(booksPath).map(p => p.split('.')[0]).includes(args.code);
            } else {
                return false;
            }
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
    }
});
