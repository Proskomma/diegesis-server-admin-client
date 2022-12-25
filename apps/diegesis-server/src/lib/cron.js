const cron = require("node-cron");
const path = require("path");
const fse = require('fs-extra');
const {Worker} = require('node:worker_threads');
const {cronOptions} = require("./makeConfig.js");
const {randomInt} = require("node:crypto");

function doSessionCron(app, frequency) {
    cron.schedule(
        cronOptions[frequency],
        () => {
            app.authSalts[0] = app.authSalts[1];
            app.authSalts[1] = shajs('sha256').update(randomInt(1000000, 9999999).toString()).digest('hex');
        }
    )
}

function doRenderCron(config) {
    cron.schedule(
        cronOptions[config.cronFrequency],
        () => {
            let nLocked = 0;
            let maxTasks = config.nWorkers;
            let taskSpecs = [];
            try {
                for (const orgDir of fse.readdirSync(path.resolve(config.dataPath))) {
                    if (taskSpecs.length > maxTasks) {
                        break;
                    }
                    const transDir = path.resolve(config.dataPath, orgDir);
                    if (fse.pathExistsSync(transDir) && fse.lstatSync(transDir).isDirectory()) {
                        for (const ownerTranslationId of fse.readdirSync(transDir)) {
                            if (taskSpecs.length > maxTasks) {
                                break;
                            }
                            for (const revision of fse.readdirSync(path.join(transDir, ownerTranslationId))) {
                                if (fse.pathExistsSync(path.join(transDir, ownerTranslationId, revision, 'succinctError.json'))) {
                                    continue;
                                }
                                if (fse.pathExistsSync(path.join(transDir, ownerTranslationId, revision, 'lock.json'))) {
                                    nLocked++;
                                    continue;
                                }
                                if (!fse.pathExistsSync(path.join(transDir, ownerTranslationId, revision, 'succinct.json'))) {
                                    const [owner, translationId] = ownerTranslationId.split("--");
                                    if (fse.pathExistsSync(path.join(transDir, ownerTranslationId, revision, 'usfmBooks'))) {
                                        if (taskSpecs.length >= maxTasks) {
                                            break;
                                        }
                                        taskSpecs.push([orgDir, owner, translationId, revision, 'usfm']);
                                    }
                                    if (fse.pathExistsSync(path.join(transDir, ownerTranslationId, revision, 'usxBooks'))) {
                                        if (taskSpecs.length >= maxTasks) {
                                            break;
                                        }
                                        taskSpecs.push([orgDir, owner, translationId, revision, 'usx']);
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
            try {
                for (const taskSpec of taskSpecs.slice(0, (taskSpecs.length - nLocked))) {
                    if (config.verbose) {
                        config.incidentLogger.info({
                            context: {running: "cronTask"},
                            taskSpec
                        });
                    }
                    const worker = new Worker('./src/lib/makeDownloads.js');
                    worker.on('message', e => config.incidentLogger.info(e));
                    worker.on('error', e => config.incidentLogger.error(e));
                    const [orgDir, owner, transId, revision, contentType] = taskSpec;
                    worker.postMessage({dataPath: config.dataPath, orgDir, owner, transId, revision, contentType});
                }
            } catch (err) {
                console.log(err.message);
            }
        }
    );
}

module.exports = {doRenderCron, doSessionCron};
