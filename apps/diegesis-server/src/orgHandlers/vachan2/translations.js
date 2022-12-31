const path = require("path");
const fse = require("fs-extra");
const {transPath} = require('../../lib/dataPaths.js');
const appRoot = path.resolve(".");

async function getTranslationsCatalog() {

    const http = require(`${appRoot}/src/lib/http.js`);

    let catalogResponse = null;
    try {
        catalogResponse = await http.getText('https://api.vachanengine.org/v2/sources?content_type=bible');
    } catch (err) {
        console.log(`    *** Error from Vachan sources endpoint: ${err.message} ***`);
    }
    if (!catalogResponse) {
        return;
    }
    const jsonData = JSON.parse(catalogResponse.data);
    const catalog = jsonData.map(t => ({
        resourceType: "bible",
        id: t.sourceName,
        languageCode: t.language.code,
        title: t.version.versionName,
        downloadURL: `https://api.vachanengine.org/v2/bibles/${t.sourceName}/books?content_type=usfm`,
        textDirection: t.language.scriptDirection.startsWith('right') ? 'rtl' : 'ltr',
        script: null,
        copyright: `${t.metaData['Copyright Holder'] || ''} ${t.license.code}`.trim(),
        description: t.metaData['Version Name (in Eng)'] || null,
        abbreviation: t.version.versionAbbreviation,
        revision: `${t.version.revision}`,
        owner: 'vachan2',
    }));
    return catalog;
}

const fetchUsfm = async (org, trans, config) => {
    const http = require(`${appRoot}/src/lib/http.js`);
    const tp = transPath(config.dataPath, org.translationDir, trans.owner, trans.id, trans.revision);
    const downloadResponse = await http.getText(trans.downloadURL);
    const responseJson = downloadResponse.data;
    const usfmBooksPath = path.join(tp, 'usfmBooks');
    if (!fse.pathExistsSync(usfmBooksPath)) {
        fse.mkdirsSync(usfmBooksPath);
    }
    fse.writeJsonSync(path.join(tp, 'metadata.json'), trans);
    for (const bookOb of JSON.parse(responseJson)) {
        const bookCode = bookOb.book.bookCode.toUpperCase();
        fse.writeFileSync(path.join(usfmBooksPath, `${bookCode}.usfm`), bookOb.USFM);
    }
};

const fetchUsx = async (org) => {
    throw new Error(`USX fetching is not supported for ${org.name}`)
};

module.exports = {getTranslationsCatalog, fetchUsfm, fetchUsx}
