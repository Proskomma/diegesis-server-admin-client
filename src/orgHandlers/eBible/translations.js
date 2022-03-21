import axios from 'axios';
import path from "path";
import fse from "fs-extra";
import jszip from "jszip";
import {ptBookArray} from "proskomma-utils";
import appRootPath from "app-root-path";
const appRoot = appRootPath.toString();

async function getTranslationsCatalog() {

    const http = await import(`${appRoot}/src/lib/http.js`);

    const catalogResponse = await http.getText('https://ebible.org/Scriptures/translations.csv');
    const catalogData = catalogResponse.data;
    const catalogRows = catalogData.split('\n')
        .map(r => r.slice(1, r.length - 1))
        .map(r => r.split(/", ?"/))

    const headers = catalogRows[0];
    const catalog = catalogRows
        .map(
        r => {
            const ret = {};
            headers.forEach((h, n) => ret[h] = r[n]);
            ret.downloadURL = `https://eBible.org/Scriptures/${ret.translationId}_usfm.zip`;
            return ret;
        }
    ).filter(t => t.languageCode)
    .map(t => ({
        id: t.translationId,
        languageCode: t.languageCode,
        languageName: t.languageName,
        title: t.title,
        description: t.description,
        copyright: t.Copyright,
    }));
    return catalog;
}

const fetchUsfm = async (org, trans) => {

    const http = await import(`${appRoot}/src/lib/http.js`);

    const transPath = path.resolve('..', 'data', org.translationDir, 'translations', trans.translationId);
    if (!fse.pathExistsSync(transPath)) {
        fse.mkdirsSync(transPath);
    }
    const downloadResponse = await http.getBuffer(trans.downloadURL);
    // fse.writeFileSync(path.join(transPath, 'archive.zip'), downloadResponse.data);
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

export { getTranslationsCatalog, fetchUsfm }
