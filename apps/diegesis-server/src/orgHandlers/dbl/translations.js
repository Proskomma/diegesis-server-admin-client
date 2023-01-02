const path = require("path");
const fse = require("fs-extra");
const jszip = require("jszip");
const {ptBookArray} = require("proskomma-utils");
const DOMParser = require('xmldom').DOMParser;
const {transPath} = require('../../lib/dataPaths.js');
const appRoot = path.resolve(".");

async function getTranslationsCatalog() {

    const http = require(`${appRoot}/src/lib/http.js`);

    const catalogResponse = await http.getText('https://app.thedigitalbiblelibrary.org/entries/_public_domain_entries_tabledata.json');
    const jsonData = JSON.parse(catalogResponse.data);
    const catalogData = Object.values(jsonData.aaData);
    const catalog = catalogData.map(t => ({
        resourceTypes: ["bible"],
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
    const entryInfoResponse = await http.getText(trans.downloadURL);
    const licenceId = entryInfoResponse.data.replace(/[\S\s]+license=(\d+)[\S\s]+/, "$1");
    const downloadResponse = await http.getBuffer(`https://app.thedigitalbiblelibrary.org/entry/download_archive?id=${trans.id}&license=${licenceId}&type=release`);
    const metadataRecord = {...trans};
    const zip = new jszip();
    await zip.loadAsync(downloadResponse.data);
    const metadata = zip.file(new RegExp('metadata.xml'));
    const metadataContent = await metadata[0].async('text');
    const parser = new DOMParser();
    const metadataRoot = parser.parseFromString(metadataContent, "application/xml").documentElement;
    metadataRecord.revision = metadataRoot.getAttribute('revision') || '???';
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
    metadataRecord.owner =
        (
            metadataRoot.getElementsByTagName('agencies')['0']
                .getElementsByTagName('rightsHolder')['0']
                .getElementsByTagName('abbr')['0']
                .childNodes[0].nodeValue || '???')
            .replace(/\s/g, "__");
    metadataRecord.copyright =
        metadataRoot.getElementsByTagName('copyright')['0']
            .getElementsByTagName('fullStatement')['0']
            .getElementsByTagName('statementContent')['0']
            .childNodes.toString()
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();
    trans.owner = metadataRecord.owner;
    trans.revision = metadataRecord.revision;
    const tp = transPath(
        config.dataPath,
        org.translationDir.replace(/\s/g, "__"),
        metadataRecord.owner.replace(/\s/g, "__"),
        trans.id, metadataRecord.revision.replace(/\s/g, "__")
    );
    if (!fse.pathExistsSync(tp)) {
        fse.mkdirsSync(tp);
    }
    const usxBooksPath = path.join(tp, 'usxBooks');
    if (!fse.pathExistsSync(usxBooksPath)) {
        fse.mkdirsSync(usxBooksPath);
    }
    fse.writeJsonSync(path.join(tp, 'metadata.json'), metadataRecord);
    for (const bookName of ptBookArray) {
        for (const usxN of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
            const foundFiles = zip.file(new RegExp(`release/USX_${usxN}/${bookName.code}[^/]*.usx$`, 'g'));
            if (foundFiles.length === 1) {
                const fileContent = await foundFiles[0].async('text');
                fse.writeFileSync(path.join(usxBooksPath, `${bookName.code}.usx`), fileContent);
                break;
            }
        }
    }
    const vrs = zip.file(new RegExp('versification.vrs'));
    const vrsContent = await vrs[0].async('text');
    const vrsPath = path.join(tp, 'versification.vrs');
    fse.writeFileSync(vrsPath, vrsContent);
};

module.exports = {getTranslationsCatalog, fetchUsfm, fetchUsx}
