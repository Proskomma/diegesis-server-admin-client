const path = require("path");

const transPath =
    (dataPath, translationDir, translationId) => {
        if (!translationId) {
            throw new Error("transPath now requires 3 arguments");
        }
        return path.resolve(
            dataPath,
            translationDir,
            'translations',
            translationId,
        );
    }

const usfmDir =
    (dataPath, translationDir, translationId) => {
        if (!translationId) {
            throw new Error("usfmDir now requires 3 arguments");
        }
        return path.join(
            transPath(dataPath, translationDir, translationId),
            'usfmBooks'
        );
    }

const usxDir =
    (dataPath, translationDir, translationId) => {
        if (!translationId) {
            throw new Error("usxDir now requires 3 arguments");
        }
        return path.join(
            transPath(dataPath, translationDir, translationId),
            'usxBooks'
        );
    }

const succinctPath =
    (dataPath, translationDir, translationId) => {
        if (!translationId) {
            throw new Error("succinctPath now requires 3 arguments");
        }
        return path.join(
            transPath(dataPath, translationDir, translationId),
            'succinct.json'
        );
    }

module.exports = {transPath, usfmDir, usxDir, succinctPath};
