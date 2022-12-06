const path = require("path");

const orgPath =
    (dataPath, translationDir) => {
        return path.resolve(
            dataPath,
            translationDir,
        );
    }

const transPath =
    (dataPath, translationDir, translationOwner, translationId, translationRevision) => {
        if (!translationRevision) {
            throw new Error("transPath now requires 5 args");
        }
        return path.resolve(
            dataPath,
            translationDir,
            `${translationOwner}--${translationId}`,
            translationRevision
        );
    }

const usfmDir =
    (dataPath, translationDir, translationOwner, translationId, translationRevision) => {
        if (!translationRevision) {
            throw new Error("usfmDir now requires 5 args");
        }
       return path.join(
            transPath(dataPath, translationDir, translationOwner, translationId, translationRevision),
            'usfmBooks'
        );
    }

const usxDir =
    (dataPath, translationDir, translationOwner, translationId, translationRevision) => {
        if (!translationRevision) {
            throw new Error("usxDir now requires 5 args");
        }
         return path.join(
             transPath(dataPath, translationDir, translationOwner, translationId, translationRevision),
            'usxBooks'
        );
    }

const succinctPath =
    (dataPath, translationDir, translationOwner, translationId, translationRevision) => {
        if (!translationRevision) {
            throw new Error("succinctPath now requires 5 args");
        }
        return path.join(
            transPath(dataPath, translationDir, translationOwner, translationId, translationRevision),
            'succinct.json'
        );
    }

const succinctErrorPath =
    (dataPath, translationDir, translationOwner, translationId, translationRevision) => {
        if (!translationRevision) {
            throw new Error("succinctErrorPath now requires 5 args");
        }
        return path.join(
            transPath(dataPath, translationDir, translationOwner, translationId, translationRevision),
            'succinctError.json'
        );
    }

const vrsPath =
    (dataPath, translationDir, translationOwner, translationId, translationRevision) => {
        if (!translationRevision) {
            throw new Error("vrsPath now requires 5 args");
        }
        return path.join(
            transPath(dataPath, translationDir, translationOwner, translationId, translationRevision),
            'versification.vrs'
        );
    }

module.exports = {orgPath, transPath, usfmDir, usxDir, succinctPath, succinctErrorPath, vrsPath};
