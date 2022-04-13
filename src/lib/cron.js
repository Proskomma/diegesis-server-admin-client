const cron = require("node-cron");
const path = require("path");
const fse = require('fs-extra');

const appRootPath = require("app-root-path");
const {cronOptions} = require("./makeConfig.js");
const makeSuccinct = require("./makeSuccinct.js");
const {transPath, usfmDir, usxDir, vrsPath} = require("./dataPaths.js");
const appRoot = appRootPath.toString();

function doCron(config) {
    cron.schedule(
        cronOptions[config.cronFrequency],
        () => {
            let taskSpec = null;
            for (const orgDir of fse.readdirSync(path.resolve(config.dataPath))) {
                if (taskSpec) {
                    break;
                }
                const transDir = path.resolve(config.dataPath, orgDir, 'translations');
                if (fse.pathExistsSync(transDir)) {
                    for (const translationId of fse.readdirSync(transDir)) {
                        if (fse.pathExistsSync(path.join(transDir, translationId, 'succinctError.json'))) {
                            continue
                        }
                        if (!fse.pathExistsSync(path.join(transDir, translationId, 'succinct.json'))) {
                            if (fse.pathExistsSync(path.join(transDir, translationId, 'usfmBooks'))) {
                                taskSpec = [orgDir, translationId, 'usfm'];
                                break;
                            }
                            if (fse.pathExistsSync(path.join(transDir, translationId, 'usxBooks'))) {
                                taskSpec = [orgDir, translationId, 'usx'];
                                break;
                            }
                        }
                    }
                }
            }
            if (taskSpec) {
                const [orgDir, transId, contentType] = taskSpec;
                try {
                    const orgJson = require(path.join(appRoot, 'src', 'orgHandlers', orgDir, 'org.json'));
                    const org = orgJson.name;
                    const t = Date.now();
                    const metadataPath = path.join(
                        transPath(config.dataPath, orgDir, transId),
                        'metadata.json'
                    );
                    const metadata = fse.readJsonSync(metadataPath);
                    let contentDir = (contentType === 'usfm') ?
                        usfmDir(config.dataPath, orgDir, transId) :
                        usxDir(config.dataPath, orgDir, transId);
                    if (!fse.pathExistsSync(contentDir)) {
                        throw new Error(`${contentType} content directory for ${org}/${transId} does not exist`);
                    }
                    let vrsContent = null;
                    const vrsP = vrsPath(config.dataPath, orgDir, transId);
                    if (fse.pathExistsSync(vrsP)) {
                        vrsContent = fse.readFileSync(vrsP).toString();
                    }
                    const succinct = makeSuccinct(
                        org,
                        metadata,
                        contentType,
                        fse.readdirSync(contentDir).map(f => fse.readFileSync(path.join(contentDir, f)).toString()),
                        vrsContent,
                    );
                    fse.writeJsonSync(path.resolve(config.dataPath, orgDir, 'translations', transId, 'succinct.json'), succinct);
                } catch (error) {
                    const succinctError = {
                        generatedBy: 'cron',
                        context: {
                            taskSpec,
                        },
                        message: error.message
                    };
                    config.incidentLogger.error(succinctError);
                    fse.writeJsonSync(path.resolve(config.dataPath, orgDir, 'translations', transId, 'succinctError.json'), succinctError);
                }
            }
        }
    );
}

module.exports = doCron;
