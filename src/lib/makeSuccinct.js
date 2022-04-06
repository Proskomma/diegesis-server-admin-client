const {UWProskomma} = require('uw-proskomma');

function makeSuccinct(selectors, docType, docs) {
    const pk = new UWProskomma();
    pk.importDocuments(
        selectors,
        docType,
        docs,
    )
    return pk.serializeSuccinct(Object.keys(pk.docSets)[0]);
}

module.exports = makeSuccinct;
