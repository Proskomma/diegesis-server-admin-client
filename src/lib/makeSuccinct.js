const {UWProskomma} = require('uw-proskomma');

function makeSuccinct(org, metadata, docType, docs, vrsContent) {
    const pk = new UWProskomma();
    pk.importDocuments(
        {
            org,
            lang: metadata.languageCode,
            abbr: metadata.abbreviation,
        },
        docType,
        docs,
    )
    const docSetId =  pk.gqlQuerySync('{docSets { id } }').data.docSets[0].id;
    let metadataTags = `"title:${metadata.title}" "copyright:${metadata.copyright}"`;
    if (metadata.textDirection) {
        metadataTags +=  ` "direction:${metadata.textDirection}"`;
    }
    if (metadata.script) {
        metadataTags +=  ` "script:${metadata.script}"`;
    }
    pk.gqlQuerySync(`mutation { addDocSetTags(docSetId: "${docSetId}", tags: [${metadataTags}]) }`);
    if (vrsContent) {
        pk.gqlQuerySync(`mutation { setVerseMapping(docSetId: "${docSetId}" vrsSource: """${vrsContent}""")}`);
    }
    return pk.serializeSuccinct(docSetId);
}

module.exports = makeSuccinct;
