const cron = require("node-cron");
const path = require("path");
const fse = require('fs-extra');

const {cronOptions} = require("./makeConfig.js");
const makeDownloads = require("./makeDownloads.js");
const {transPath, usfmDir, usxDir, vrsPath, succinctPath, perfDir, sofriaDir, succinctErrorPath} = require("./dataPaths.js");
const appRoot = path.resolve(".");

function doCron(config) {
    cron.schedule(
        cronOptions[config.cronFrequency],
        () => {
            let taskSpec = null;
            try {
                for (const orgDir of fse.readdirSync(path.resolve(config.dataPath))) {
                    if (taskSpec) {
                        break;
                    }
                    const transDir = path.resolve(config.dataPath, orgDir);
                    if (fse.pathExistsSync(transDir) && fse.lstatSync(transDir).isDirectory()) {
                        for (const ownerTranslationId of fse.readdirSync(transDir)) {
                            for (const revision of fse.readdirSync(path.join(transDir, ownerTranslationId))) {
                                if (fse.pathExistsSync(path.join(transDir, ownerTranslationId, revision, 'succinctError.json'))) {
                                    continue
                                }
                                if (!fse.pathExistsSync(path.join(transDir, ownerTranslationId, revision, 'succinct.json'))) {
                                    const [owner, translationId] = ownerTranslationId.split("--");
                                    if (fse.pathExistsSync(path.join(transDir, ownerTranslationId, revision, 'usfmBooks'))) {
                                        taskSpec = [orgDir, owner, translationId, revision, 'usfm'];
                                        break;
                                    }
                                    if (fse.pathExistsSync(path.join(transDir, ownerTranslationId, revision, 'usxBooks'))) {
                                        taskSpec = [orgDir, owner, translationId, revision, 'usx'];
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                const succinctError = {
                    generatedBy: 'cron',
                    context: {},
                    message: err.message
                };
                config.incidentLogger.error(succinctError);
                return;
            }
            if (taskSpec) {
                const [orgDir, owner, transId, revision, contentType] = taskSpec;
                try {
                    const orgJson = require(path.join(appRoot, 'src', 'orgHandlers', orgDir, 'org.json'));
                    const org = orgJson.name;
                    const t = Date.now();
                    const metadataPath = path.join(
                        transPath(config.dataPath, orgDir, owner, transId, revision),
                        'metadata.json'
                    );
                    const metadata = fse.readJsonSync(metadataPath);
                    let contentDir = (contentType === 'usfm') ?
                        usfmDir(config.dataPath, orgDir, owner, transId, revision) :
                        usxDir(config.dataPath, orgDir, owner, transId, revision);
                    if (!fse.pathExistsSync(contentDir)) {
                        throw new Error(`${contentType} content directory for ${org}/${owner}/${transId}/${revision} does not exist`);
                    }
                    let vrsContent = null;
                    const vrsP = vrsPath(config.dataPath, orgDir, owner, transId, revision);
                    if (fse.pathExistsSync(vrsP)) {
                        vrsContent = fse.readFileSync(vrsP).toString();
                    }
                    const downloads = makeDownloads(
                        org,
                        metadata,
                        contentType,
                        fse.readdirSync(contentDir).map(f => fse.readFileSync(path.join(contentDir, f)).toString()),
                        vrsContent,
                    );
                    const perfD = perfDir(config.dataPath, orgDir, owner, transId, revision);
                    if (!fse.pathExistsSync(perfD)) {
                        fse.mkdir(perfD);
                    }
                    for (const [bookCode, perf] of downloads.perf) {
                        fse.writeFileSync(path.join(perfD, `${bookCode}.json`), JSON.stringify(JSON.parse(perf), null, 2));
                    }
                    const sofriaD = sofriaDir(config.dataPath, orgDir, owner, transId, revision);
                    if (!fse.pathExistsSync(sofriaD)) {
                        fse.mkdir(sofriaD);
                    }
                    for (const [bookCode, sofria] of downloads.sofria) {
                        fse.writeFileSync(path.join(sofriaD, `${bookCode}.json`), JSON.stringify(JSON.parse(sofria), null, 2));
                    }
                    fse.writeJsonSync(succinctPath(config.dataPath, orgDir, owner, transId, revision), downloads.succinct);
                } catch (error) {
                    const succinctError = {
                        generatedBy: 'cron',
                        context: {
                            taskSpec,
                        },
                        message: error.message
                    };
                    config.incidentLogger.error(succinctError);
                    fse.writeJsonSync(succinctErrorPath(config.dataPath, orgDir, owner, transId, revision), succinctError);
                }
            }
        }
    );
}

module.exports = doCron;
