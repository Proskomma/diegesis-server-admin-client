const cron = require("node-cron");
const path = require("path");
const fse = require('fs-extra');
const {Worker} = require('node:worker_threads');
const {cronOptions} = require("./makeConfig.js");

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
                if (config.verbose) {
                    config.incidentLogger.info({
                        context: {running: "cronTask"},
                        taskSpec
                    });
                }
                try {
                    const worker = new Worker('./src/lib/makeDownloads.js');
                    worker.on('message', e => config.incidentLogger.info(e));
                    worker.on('error', e => config.incidentLogger.error(e));
                    const [orgDir, owner, transId, revision, contentType] = taskSpec;
                    worker.postMessage({dataPath: config.dataPath, orgDir, owner, transId, revision, contentType});
                } catch (err) {
                    console.log(err.message);
                }
            }
        }
    );
}

module.exports = doCron;
