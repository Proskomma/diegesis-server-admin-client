const path = require("path");

const transPath =
    (dataPath, translationDir, translationId) => {
        return path.resolve(
            dataPath,
            translationDir,
            'translations',
            translationId,
        );
    }

const usfmDir =
    (dataPath, translationDir, translationId) => {
       return path.join(
            transPath(dataPath, translationDir, translationId),
            'usfmBooks'
        );
    }

const usxDir =
    (dataPath, translationDir, translationId) => {
         return path.join(
            transPath(dataPath, translationDir, translationId),
            'usxBooks'
        );
    }

const succinctPath =
    (dataPath, translationDir, translationId) => {
        return path.join(
            transPath(dataPath, translationDir, translationId),
            'succinct.json'
        );
    }

const succinctErrorPath =
    (dataPath, translationDir, translationId) => {
        return path.join(
            transPath(dataPath, translationDir, translationId),
            'succinctError.json'
        );
    }

const vrsPath =
    (dataPath, translationDir, translationId) => {
        return path.join(
            transPath(dataPath, translationDir, translationId),
            'versification.vrs'
        );
    }

module.exports = {transPath, usfmDir, usxDir, succinctPath, succinctErrorPath, vrsPath};
