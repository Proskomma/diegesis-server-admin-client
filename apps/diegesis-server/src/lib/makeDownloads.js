const {Proskomma} = require('proskomma-core');

function makeDownloads(config, org, metadata, docType, docs, vrsContent) {
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
    const ret = {
        succinct: null,
        perf: [],
        sofria: [],
    };
    let docSetId;
    try {
        pk.importDocuments(
            {
                source: org,
                owner: metadata.owner.replace(/\s/g, "__"),
                project: metadata.abbreviation.replace(/\s/g, "__"),
                revision: metadata.revision.replace(/\s/g, "__"),
            },
            docType,
            docs,
        );
        docSetId = pk.gqlQuerySync('{docSets { id } }').data.docSets[0].id;
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
        ret.succinct = pk.serializeSuccinct(docSetId);
    } catch (err) {
        ret.succinctError = {
            generatedBy: 'cron',
            context: {
                docSetId: docSetId || "???",
                making: "succinct",
            },
            message: err.message
        };
        config.incidentLogger.error(ret.succinctError);
        return;
    }
    const documents = pk.gqlQuerySync(`{docSet(id: """${docSetId}""") {documents { id bookCode: header(id:"bookCode")} } }`).data.docSet.documents.map(d => ({id: d.id, book: d.bookCode}));
    for (const doc of documents) {
        try {
            let docResult = pk.gqlQuerySync(`{ document(id: """${doc.id}""") { bookCode: header(id:"bookCode") perf } }`).data.document;
            ret.perf.push([docResult.bookCode, docResult.perf]);
        } catch (err) {
            config.incidentLogger.error({
                generatedBy: 'cron',
                context: {
                    docSetId,
                    doc: doc.id,
                    book: doc.book,
                    making: "perf"
                },
                message: err.message,
            });
        }
        try {
            const docResult = pk.gqlQuerySync(`{document(id: """${doc.id}""") { bookCode: header(id:"bookCode") sofria } }`).data.document;
            ret.sofria.push([docResult.bookCode, docResult.sofria]);
        } catch (err) {
            config.incidentLogger.error({
                generatedBy: 'cron',
                context: {
                    docSetId,
                    doc: doc.id,
                    book: doc.book,
                    making: "sofria"
                },
                message: err.message,
            });
        }
    }
    return ret;
}

module.exports = makeDownloads;
