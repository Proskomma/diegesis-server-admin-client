import path from "path";
import fse from "fs-extra";
import appRootPath from "app-root-path";
const appRoot = appRootPath.toString();

async function getTranslationsCatalog() {

    const http = await import(`${appRoot}/src/lib/http.js`);

    const catalogResponse = await http.getText('https://api.vachanengine.org/v2/sources?content_type=bible');
    const catalogData = catalogResponse.data;
    const catalog = catalogData.map(t => ({
        id: t.sourceName,
        languageCode: t.language.code,
        languageName: t.language.language,
        title: t.version.versionName,
        description: t.version.versionName,
        copyright: t.license.name,
        downloadURL: `https://api.vachanengine.org/v2/bibles/${t.sourceName}/books?content_type=usfm`,
    }));
    return catalog;
}

const fetchUsfm = async (org, trans) => {
    const http = await import(`${appRoot}/src/lib/http.js`);
    const transPath = path.resolve(appRoot, 'data', org.translationDir, 'translations', trans.id);
    const downloadResponse = await http.getText(trans.downloadURL);
    const responseJson = downloadResponse.data;
    const usfmBooksPath = path.join(transPath, 'usfmBooks');
    if (!fse.pathExistsSync(usfmBooksPath)) {
        fse.mkdirsSync(usfmBooksPath);
    }
    for (const bookOb of responseJson) {
        const bookCode = bookOb.book.bookCode.toUpperCase();
        fse.writeFileSync(path.join(usfmBooksPath, `${bookCode}.usfm`), bookOb.USFM);
    }
};

const fetchUsx = async (org) => {throw new Error(`USX fetching is not supported for ${org.name}`)};

export { getTranslationsCatalog, fetchUsfm, fetchUsx }
