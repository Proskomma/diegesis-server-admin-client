const {Proskomma} = require('proskomma-core');
const {PerfRenderFromProskomma, transforms, mergeActions} = require('proskomma-json-tools');
const {ptBooks} = require('proskomma-utils');
const path = require("path");
const fse = require('fs-extra');
const {parentPort} = require("node:worker_threads");
const {
    transPath,
    usfmDir,
    usxDir,
    vrsPath,
    succinctErrorPath,
    perfDir,
    simplePerfDir,
    sofriaDir,
    succinctPath,
    lockPath,
} = require("./dataPaths.js");
const documentStatsActions = require("./documentStatsActions");
const localJustTheBibleActions = require("./localJustTheBibleActions");

const appRoot = path.resolve(".");

function doDownloads({dataPath, orgDir, owner, transId, revision, contentType}) {
    try {
        const orgJson = require(path.join(appRoot, 'src', 'orgHandlers', orgDir, 'org.json'));
        const org = orgJson.name;
        const t = Date.now();
        const metadataPath = path.join(
            transPath(dataPath, orgDir, owner, transId, revision),
            'metadata.json'
        );
        fse.writeJsonSync(lockPath(dataPath, orgDir, owner, transId, revision), {orgDir, owner, transId, revision});
        const metadata = fse.readJsonSync(metadataPath);
        let contentDir = (contentType === 'usfm') ?
            usfmDir(dataPath, orgDir, owner, transId, revision) :
            usxDir(dataPath, orgDir, owner, transId, revision);
        if (!fse.pathExistsSync(contentDir)) {
            throw new Error(`${contentType} content directory for ${org}/${owner}/${transId}/${revision} does not exist`);
        }
        let vrsContent = null;
        const vrsP = vrsPath(dataPath, orgDir, owner, transId, revision);
        if (fse.pathExistsSync(vrsP)) {
            vrsContent = fse.readFileSync(vrsP).toString();
        }
        const downloads = makeDownloads(
            dataPath,
            org,
            orgDir,
            metadata,
            contentType,
            fse.readdirSync(contentDir).map(f => fse.readFileSync(path.join(contentDir, f)).toString()),
            vrsContent,
        );
        if (downloads.succinctError) {
            fse.writeJsonSync(succinctErrorPath(dataPath, orgDir, owner, transId, revision), downloads.succinctError);
            fse.remove(lockPath(dataPath, orgDir, owner, transId, revision));
            return;
        }
        const perfD = perfDir(dataPath, orgDir, owner, transId, revision);
        if (!fse.pathExistsSync(perfD)) {
            fse.mkdir(perfD);
        }
        for (const [bookCode, perf] of downloads.perf) {
            fse.writeFileSync(path.join(perfD, `${bookCode}.json`), JSON.stringify(JSON.parse(perf), null, 2));
        }
        const simplePerfD = simplePerfDir(dataPath, orgDir, owner, transId, revision);
        if (!fse.pathExistsSync(simplePerfD)) {
            fse.mkdir(simplePerfD);
        }
        for (const [bookCode, simplePerf] of downloads.simplePerf) {
            fse.writeFileSync(path.join(simplePerfD, `${bookCode}.json`), JSON.stringify(JSON.parse(simplePerf), null, 2));
        }
        const sofriaD = sofriaDir(dataPath, orgDir, owner, transId, revision);
        if (!fse.pathExistsSync(sofriaD)) {
            fse.mkdir(sofriaD);
        }
        for (const [bookCode, sofria] of downloads.sofria) {
            fse.writeFileSync(path.join(sofriaD, `${bookCode}.json`), JSON.stringify(JSON.parse(sofria), null, 2));
        }
        fse.writeJsonSync(succinctPath(dataPath, orgDir, owner, transId, revision), downloads.succinct);
    } catch (err) {
        const succinctError = {
            generatedBy: 'cron',
            context: {
                taskSpec,
            },
            message: err.message
        };
        parentPort.postMessage(succinctError);
        fse.writeJsonSync(succinctErrorPath(dataPath, orgDir, owner, transId, revision), succinctError);
        fse.remove(lockPath(dataPath, orgDir, owner, transId, revision));
        return;
    }
    fse.remove(lockPath(dataPath, orgDir, owner, transId, revision));
    parentPort.postMessage({orgDir, owner, transId, revision, status: "done"});
}

function makeDownloads(dataPath, org, orgDir, metadata, docType, docs, vrsContent) {
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
        simplePerf: [],
        sofria: [],
        stats: {
            nOT: 0,
            nNT: 0,
            nDC: 0,
            nChapters: 0,
            nVerses: 0,
            nIntroductions: 0,
            nHeadings: 0,
            nFootnotes: 0,
            nXrefs: 0,
            nStrong: 0,
            nLemma: 0,
            nGloss: 0,
            nContent: 0,
            nMorph: 0,
            nOccurrences: 0,
            documents: {}
        }
    };
    let docSetId;
    let docInfo;
    try {
        pk.importDocuments(
            {
                source: org,
                owner: metadata.owner,
                project: metadata.id,
                revision: metadata.revision,
            },
            docType,
            docs,
        );
        const docSet = pk.gqlQuerySync('{docSets { id documents { bookCode: header(id: "bookCode") sequences {type} } } }').data.docSets[0];
        docSetId = docSet.id;
        const docSetBookCodes = docSet.documents.map(d => d.bookCode);
        for (const bookCode of docSetBookCodes) {
            for (const section of ['ot', 'nt', 'dc']) {
                if (ptBooks[bookCode].categories.includes(section)) {
                    ret.stats[`n${section.toUpperCase()}`]++;
                }
            }
        }
        const sequenceTypes = new Set([]);
        for (const sequences of docSet.documents.map(d => d.sequences)) {
            for (const sequenceType of sequences.map(s => s.type)) {
                sequenceTypes.add(sequenceType);
            }
        }

        let metadataTags = `"title:${metadata.title}" "copyright:${metadata.copyright}" "language:${metadata.languageCode}"`;
        metadataTags += ` "nOT:${ret.stats.nOT}" "nNT:${ret.stats.nNT}" "nDC:${ret.stats.nDC}"`;
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
        parentPort.postMessage(ret.succinctError);
        fse.remove(lockPath(dataPath, orgDir, owner, transId, revision));
        return;
    }
    const documents = pk.gqlQuerySync(`{docSet(id: """${docSetId}""") {documents { id bookCode: header(id:"bookCode")} } }`).data.docSet.documents.map(d => ({
        id: d.id,
        book: d.bookCode
    }));
    for (const doc of documents) {
        let docResult = null;
        try {
            docResult = pk.gqlQuerySync(`{ document(id: """${doc.id}""") { bookCode: header(id:"bookCode") perf } }`).data.document;
            ret.perf.push([docResult.bookCode, docResult.perf]);
        } catch (err) {
            docResult = null;
            parentPort.postMessage({
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
        if (docResult) {
            try {
                const cl = new PerfRenderFromProskomma(
                    {
                        proskomma: pk,
                        actions: mergeActions(
                            [
                                localJustTheBibleActions,
                                transforms.perf2perf.identityActions
                            ]
                        ),
                    },
                );
                const output = {};

                cl.renderDocument(
                    {
                        docId: doc.id,
                        config: {},
                        output,
                    },
                );
                const simplePerf = transforms.alignment.mergePerfText.code({perf: output.perf}).perf;
                ret.simplePerf.push([docResult.bookCode, JSON.stringify(simplePerf)]);
            } catch (err) {
                docResult = null;
                parentPort.postMessage({
                    generatedBy: 'cron',
                    context: {
                        docSetId,
                        doc: doc.id,
                        book: doc.book,
                        making: "simplePerf"
                    },
                    message: err.message,
                });
            }
        }
        if (docResult) {
            try {
                const cl = new PerfRenderFromProskomma(
                    {
                        proskomma: pk,
                        actions: documentStatsActions,
                    },
                );
                const output = {};

                cl.renderDocument(
                    {
                        docId: doc.id,
                        config: {},
                        output,
                    },
                );
                ret.stats.documents[doc.book] = output;
            } catch (err) {
                docResult = null;
                parentPort.postMessage({
                    generatedBy: 'cron',
                    context: {
                        docSetId,
                        doc: doc.id,
                        book: doc.book,
                        making: "stats"
                    },
                    message: err.message,
                });
            }
        }
        try {
            const docResult = pk.gqlQuerySync(`{document(id: """${doc.id}""") { bookCode: header(id:"bookCode") sofria } }`).data.document;
            ret.sofria.push([docResult.bookCode, docResult.sofria]);
        } catch (err) {
            parentPort.postMessage({
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
    try {
        for (const [book, bookStats] of Object.entries(ret.stats.documents)) {
            for (const stat of [
                "nChapters",
                "nVerses",
                "nIntroductions",
                "nHeadings",
                "nFootnotes",
                "nXrefs",
                "nStrong",
                "nLemma",
                "nGloss",
                "nContent",
                "nMorph",
                "nOccurrences",
            ]) {
                ret.stats[stat] += bookStats[stat];
            }
            const metadataPath = path.join(
                transPath(
                    dataPath,
                    orgDir,
                    metadata.owner,
                    metadata.id,
                    metadata.revision
                ),
                'metadata.json'
            );
            const newMetadata = {...metadata, stats: ret.stats};
            for (const toDelete of ["ot", "nt", "dc", "hasIntroductions", "hasHeadings", "hasFootnotes", "hasXrefs"]) {
                delete newMetadata[toDelete];
            }
            fse.writeFileSync(metadataPath, JSON.stringify(newMetadata, null, 2));
        }
    } catch
        (err) {
        parentPort.postMessage({
            generatedBy: 'cron',
            context: {
                docSetId,
                making: "augmented metadata.json"
            },
            message: err.message,
        });
    }
    return ret;
}

parentPort.on("message", data => {
    doDownloads(data);
});
