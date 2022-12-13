const {Proskomma} = require('proskomma-core');
const path = require("path");
const {
    transPath,
    usfmDir,
    usxDir,
    vrsPath,
    succinctErrorPath,
    perfDir,
    sofriaDir,
    succinctPath,
    lockPath,
} = require("./dataPaths.js");
const fse = require('fs-extra');
const {parentPort} = require("node:worker_threads");
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

function makeDownloads(dataPath, org, metadata, docType, docs, vrsContent) {
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
        parentPort.postMessage(ret.succinctError);
        fse.remove(lockPath(dataPath, orgDir, owner, transId, revision));
        return;
    }
    const documents = pk.gqlQuerySync(`{docSet(id: """${docSetId}""") {documents { id bookCode: header(id:"bookCode")} } }`).data.docSet.documents.map(d => ({id: d.id, book: d.bookCode}));
    for (const doc of documents) {
        try {
            let docResult = pk.gqlQuerySync(`{ document(id: """${doc.id}""") { bookCode: header(id:"bookCode") perf } }`).data.document;
            ret.perf.push([docResult.bookCode, docResult.perf]);
        } catch (err) {
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
