const {Proskomma} = require('proskomma-core');
const {PerfRenderFromProskomma, transforms, mergeActions} = require('proskomma-json-tools');
const {ptBooks} = require('proskomma-utils');
const path = require("path");
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
const fse = require('fs-extra');
const {parentPort} = require("node:worker_threads");
const appRoot = path.resolve(".");

const localJustTheBibleActions = {
    startMilestone: [
        {
            description: "Ignore startMilestone events",
            test: () => true,
            action: () => {
            }
        },
    ],
    endMilestone: [
        {
            description: "Ignore endMilestone events",
            test: () => true,
            action: () => {
            }
        },
    ],
    startWrapper: [
        {
            description: "Ignore startWrapper events",
            test: () => true,
            action: () => {
            }
        },
    ],
    endWrapper: [
        {
            description: "Ignore endWrapper events",
            test: () => true,
            action: () => {
            }
        },
    ],
    blockGraft: [
        {
            description: "Ignore blockGraft events, except for title (\\mt)",
            test: (environment) => environment.context.sequences[0].block.subType !== 'title',
            action: (environment) => {
            }
        },
    ],
    inlineGraft: [
        {
            description: "Ignore inlineGraft events",
            test: () => true,
            action: () => {
            }
        },
    ],
    mark: [
        {
            description: "Ignore mark events, except for chapter and verses",
            test: ({context}) => !['chapter', 'verses'].includes(context.sequences[0].element.subType),
            action: () => {
            }
        },
    ]
};

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
        simpleSofria: []
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
        const docSet = pk.gqlQuerySync('{docSets { id documents { bookCode: header(id: "bookCode") } } }').data.docSets[0];
        docSetId = docSet.id;
        const docSetBookCodes = docSet.documents.map(d => d.bookCode);
        const docInfo = {
            ot: 0,
            nt: 0,
            dc: 0
        };
        for (const bookCode of docSetBookCodes) {
            for (const section of Object.keys(docInfo)) {
                if (ptBooks[bookCode].categories.includes(section)) {
                    docInfo[section]++;
                }
            }
        }
        const metadataPath = path.join(
            transPath(
                dataPath,
                orgDir,
                metadata.owner.replace(/\s/g, "__"),
                metadata.id,
                metadata.revision.replace(/\s/g,"__")
            ),
            'metadata.json'
        );
        const newMetadata = {...metadata, ...docInfo};
        fse.writeJsonSync(metadataPath, newMetadata);

        let metadataTags = `"title:${metadata.title}" "copyright:${metadata.copyright}" "language:${metadata.languageCode}"`;
        metadataTags += ` "nOT:${docInfo.ot}" "nNT:${docInfo.nt}" "nDC:${docInfo.dc}"`;
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
    const documents = pk.gqlQuerySync(`{docSet(id: """${docSetId}""") {documents { id bookCode: header(id:"bookCode")} } }`).data.docSet.documents.map(d => ({id: d.id, book: d.bookCode}));
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
    return ret;
}

parentPort.on("message", data => {
    doDownloads(data);
});
