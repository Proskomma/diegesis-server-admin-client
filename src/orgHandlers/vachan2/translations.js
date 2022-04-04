const path = require("path");
const fse = require("fs-extra");
const appRootPath =require("app-root-path");
const {transPath} = require('../../lib/dataPaths.js');
const appRoot = appRootPath.toString();

async function getTranslationsCatalog() {

    const http = require(`${appRoot}/src/lib/http.js`);

    const catalogResponse = await http.getText('https://api.vachanengine.org/v2/sources?content_type=bible');
    const catalogData = catalogResponse.data;
    const catalog = catalogData.map(t => ({
        id: t.sourceName,
        languageCode: t.language.code,
        title: t.version.versionName,
        downloadURL: `https://api.vachanengine.org/v2/bibles/${t.sourceName}/books?content_type=usfm`,
    }));
    return catalog;
}

const fetchUsfm = async (org, trans, config) => {
    const http = require(`${appRoot}/src/lib/http.js`);
    const tp = transPath(config.dataPath, org.translationDir, trans.id);
    const downloadResponse = await http.getText(trans.downloadURL);
    const responseJson = downloadResponse.data;
    const usfmBooksPath = path.join(tp, 'usfmBooks');
    if (!fse.pathExistsSync(usfmBooksPath)) {
        fse.mkdirsSync(usfmBooksPath);
    }
    for (const bookOb of responseJson) {
        const bookCode = bookOb.book.bookCode.toUpperCase();
        fse.writeFileSync(path.join(usfmBooksPath, `${bookCode}.usfm`), bookOb.USFM);
    }
};

const fetchUsx = async (org) => {throw new Error(`USX fetching is not supported for ${org.name}`)};

module.exports = { getTranslationsCatalog, fetchUsfm, fetchUsx }
