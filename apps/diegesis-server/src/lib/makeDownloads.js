const {Proskomma} = require('proskomma-core');

function makeDownloads(org, metadata, docType, docs, vrsContent) {
    const pk = new Proskomma([
        {
            name: "source",
            type: "string",
            regex: "^[^\\s]+$"
        },
        {
            name: "owner",
            type: "string",
            regex: "^[^\\s]+$"
        },
        {
            name: "project",
            type: "string",
            regex: "^[^\\s]+$"
        },
        {
            name: "revision",
            type: "string",
            regex: "^[^\\s]+$"
        },
    ]);
    pk.importDocuments(
        {
            source: org,
            owner: metadata.owner,
            project: metadata.abbreviation,
            revision: metadata.revision,
        },
        docType,
        docs,
    );
    const docSetId = pk.gqlQuerySync('{docSets { id } }').data.docSets[0].id;
    let metadataTags = `"title:${metadata.title}" "copyright:${metadata.copyright}" "language:${metadata.languageCode}"`;
    if (metadata.textDirection) {
        metadataTags += ` "direction:${metadata.textDirection}"`;
    }
    if (metadata.script) {
        metadataTags += ` "script:${metadata.script}"`;
    }
    pk.gqlQuerySync(`mutation { addDocSetTags(docSetId: "${docSetId}", tags: [${metadataTags}]) }`);
    if (vrsContent) {
        pk.gqlQuerySync(`mutation { setVerseMapping(docSetId: "${docSetId}" vrsSource: """${vrsContent}""")}`);
    }
    const perfResult = pk.gqlQuerySync(`{docSet(id: "${docSetId}") { documents { bookCode: header(id:"bookCode") perf } } }`);
    const sofriaResult = pk.gqlQuerySync(`{docSet(id: "${docSetId}") { documents { bookCode: header(id:"bookCode") sofria } } }`);
    return {
        succinct: pk.serializeSuccinct(docSetId),
        perf: perfResult.data.docSet.documents.map(d => [d.bookCode, d.perf]),
        sofria: sofriaResult.data.docSet.documents.map(d => [d.bookCode, d.sofria]),
    };
}

module.exports = makeDownloads;
