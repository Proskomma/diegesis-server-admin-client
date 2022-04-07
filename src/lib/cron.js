const cron = require("node-cron");
const path = require("path");
const fse = require('fs-extra');

const appRootPath = require("app-root-path");
const {cronOptions} = require("./makeConfig.js");
const makeSuccinct = require("./makeSuccinct.js");
const {transPath, usfmDir, usxDir} = require("./dataPaths.js");
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
                const orgJson = require(path.join(appRoot, 'src', 'orgHandlers', orgDir, 'org.json'));
                const org = orgJson.name;
                const t = Date.now();
                console.log('Making succinct for', `${org}/${transId} from ${contentType}`);
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
                const succinct = makeSuccinct(
                    org,
                    metadata,
                    contentType,
                    fse.readdirSync(contentDir).map(f => fse.readFileSync(path.join(contentDir, f)).toString()));
                fse.writeJsonSync(path.resolve(config.dataPath, orgDir, 'translations', transId, 'succinct.json'), succinct);
                console.log(`  Made in ${(Date.now() - t) / 1000} sec`);
            }
        }
    );
}

module.exports = doCron;
