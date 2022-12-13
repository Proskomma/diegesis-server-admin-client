const path = require("path");
const fse = require("fs-extra");

async function getTranslationsCatalog(config) {
    let catalog = [];
    const translationsDir = path.join(config.dataPath, 'localusx', 'translations');
    for (const transId of fse.readdirSync(path.join(translationsDir))) {
        const metadataPath = path.join(translationsDir, transId, 'metadata.json');
        catalog.push(fse.readJsonSync(metadataPath));
    }
    return catalog;
}

const fetchUsfm = async (org) => {throw new Error(`USFM fetching is not supported for local pseudoOrg ${org.name}`)};

const fetchUsx = async (org) => {throw new Error(`USX fetching is not supported for local pseudoOrg ${org.name}`)};

module.exports = { getTranslationsCatalog, fetchUsfm, fetchUsx }
