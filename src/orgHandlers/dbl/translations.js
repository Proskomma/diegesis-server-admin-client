const path = require("path");
const fse = require("fs-extra");
const jszip = require("jszip");
const {ptBookArray} = require("proskomma-utils");
const appRootPath = require("app-root-path");
const DOMParser = require('xmldom').DOMParser;
const {transPath} = require('../../lib/dataPaths.js');
const appRoot = appRootPath.toString();

async function getTranslationsCatalog() {

    const http = require(`${appRoot}/src/lib/http.js`);

    const catalogResponse = await http.getText('https://app.thedigitalbiblelibrary.org/entries/_public_domain_entries_tabledata.json');
    const catalogData = Object.values(catalogResponse.data.aaData);
    const catalog = catalogData.map(t => ({
        id: t[0],
        languageCode: t[2],
        title: t[4],
        downloadURL: `https://app.thedigitalbiblelibrary.org/entry?id=${t[0]}`,
    }));
    return catalog;
}

const fetchUsfm = async (org) => {
    throw new Error(`USFM fetching is not supported for ${org.name}`)
};

const fetchUsx = async (org, trans, config) => {

    const http = require(`${appRoot}/src/lib/http.js`);
    const tp = transPath(config.dataPath, org.translationDir, trans.id);
    if (!fse.pathExistsSync(tp)) {
        fse.mkdirsSync(tp);
    }
    const entryInfoResponse = await http.getText(trans.downloadURL);
    const licenceId = entryInfoResponse.data.replace(/[\S\s]+license=(\d+)[\S\s]+/, "$1");
    const downloadResponse = await http.getBuffer(`https://app.thedigitalbiblelibrary.org/entry/download_archive?id=${trans.id}&license=${licenceId}&type=release`);
    const usxBooksPath = path.join(tp, 'usxBooks');
    if (!fse.pathExistsSync(usxBooksPath)) {
        fse.mkdirsSync(usxBooksPath);
    }
    const metadataRecord = {...trans};
    const zip = new jszip();
    await zip.loadAsync(downloadResponse.data);
    const metadata = zip.file(new RegExp('metadata.xml'));
    const metadataContent = await metadata[0].async('text');
    const parser = new DOMParser();
    const metadataRoot = parser.parseFromString(metadataContent, "application/xml").documentElement;
    metadataRecord.description =
        metadataRoot.getElementsByTagName('identification')['0']
            .getElementsByTagName('description')['0']
            .childNodes[0].nodeValue;
    metadataRecord.textDirection =
        metadataRoot.getElementsByTagName('language')['0']
            .getElementsByTagName('scriptDirection')['0']
            .childNodes[0].nodeValue.toLowerCase();
    metadataRecord.script =
        metadataRoot.getElementsByTagName('language')['0']
            .getElementsByTagName('scriptCode')['0']
            .childNodes[0].nodeValue;
    metadataRecord.abbreviation =
        metadataRoot.getElementsByTagName('identification')['0']
            .getElementsByTagName('abbreviation')['0']
            .childNodes[0].nodeValue;
    metadataRecord.copyright =
        metadataRoot.getElementsByTagName('copyright')['0']
            .getElementsByTagName('fullStatement')['0']
            .getElementsByTagName('statementContent')['0']
            .childNodes.toString()
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();
    fse.writeJsonSync(path.join(tp, 'metadata.json'), metadataRecord);
    for (const bookName of ptBookArray) {
        const foundFiles = zip.file(new RegExp(`release/USX_1/${bookName.code}[^/]*.usx$`, 'g'));
        if (foundFiles.length === 1) {
            const fileContent = await foundFiles[0].async('text');
            fse.writeFileSync(path.join(usxBooksPath, `${bookName.code}.usx`), fileContent);
        }
    }
};

module.exports = {getTranslationsCatalog, fetchUsfm, fetchUsx}
