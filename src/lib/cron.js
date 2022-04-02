import cron from "node-cron";
import {cronOptions} from "./makeConfig.js";
import path from "path";
import fse from 'fs-extra';

import appRootPath from "app-root-path";
const appRoot = appRootPath.toString();

export default function doCron(config) {
    cron.schedule(
        cronOptions[config.cronFrequency],
        config => {
            let taskSpec = null;
            for (const orgDir of fse.readdirSync(path.resolve(appRoot, 'data'))) {
                if (taskSpec) {
                    break;
                }
                const transDir = path.resolve(appRoot, 'data', orgDir, 'translations');
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
                console.log(taskSpec.join('/'));
                fse.writeJsonSync(path.resolve(appRoot, 'data', taskSpec[0], 'translations', taskSpec[1], 'succinct.json'), {});
            }
        }
    );
}
