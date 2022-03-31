import path from "path";
import fse from "fs-extra";
import jszip from "jszip";
import {ptBookArray} from "proskomma-utils";
import appRootPath from "app-root-path";
const appRoot = appRootPath.toString();

async function getTranslationsCatalog() {

    const http = await import(`${appRoot}/src/lib/http.js`);

    const catalogResponse = await http.getText('https://git.door43.org/api/v1/repos/search?owner=unfoldingWord&subject=Aligned%20Bible,Bible,Hebrew%20Old%20Testament,Greek%20New%20Testament');
    const catalogData = catalogResponse.data.data;
    const catalog = catalogData.map(t => ({
        id: `${t.id}`,
        languageCode: t.language,
        languageName: t.language,
        title: t.title.trim(),
        description: t.description.replace(/\n[\s\S]*/, "").trim() || t.title.trim(),
        copyright: null,
        downloadURL: `https://git.door43.org/api/v1/repos/${t.full_name}`,
    }));
    return catalog;
}

const fetchUsfm = async (org, trans) => {
    const http = await import(`${appRoot}/src/lib/http.js`);
    const transPath = path.resolve(appRoot, 'data', org.translationDir, 'translations', trans.id);
    const repoDetailsResponse = await http.getText(trans.downloadURL);
    const responseJson = repoDetailsResponse.data;
    const zipUrl = responseJson.catalog.latest.zipball_url;
    const downloadResponse = await http.getBuffer(zipUrl);
    const usfmBooksPath = path.join(transPath, 'usfmBooks');
    if (!fse.pathExistsSync(usfmBooksPath)) {
        fse.mkdirsSync(usfmBooksPath);
    }
    const zip = new jszip();
    await zip.loadAsync(downloadResponse.data);
    for (const bookName of ptBookArray) {
        const foundFiles = zip.file(new RegExp(`${bookName.code}[^/]*.usfm$`, 'g'));
        if (foundFiles.length === 1) {
            const fileContent = await foundFiles[0].async('text');
            fse.writeFileSync(path.join(usfmBooksPath, `${bookName.code}.usfm`), fileContent);
        }
    }
};

const fetchUsx = async (org) => {throw new Error(`USX fetching is not supported for ${org.name}`)};

export { getTranslationsCatalog, fetchUsfm, fetchUsx }
