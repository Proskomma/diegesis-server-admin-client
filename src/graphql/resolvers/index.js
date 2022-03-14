import path from 'path';
import fse from 'fs-extra';

const orgsJson = fse.readJsonSync(path.resolve('..', 'static', 'orgs.json'));

export default ({
    Query: {
        orgs: () => Object.values(orgsJson),
    },
    Org: {
        translations: () => fse.readJsonSync(path.resolve('..', 'static', 'ebible', 'catalog.json')),
    },
    Translation: {
        id: trans => trans.translationId || '',
        languageCode: trans => trans.languageCode || '',
        languageLocalName: trans => trans.languageName || '',
        languageEnglishName: trans => trans.languageNameinEnglish || '',
        longTitle: trans => trans.title || '',
        shortTitle: trans => trans.shortTitle || '',
        description: trans => trans.description || '',
        copyright: trans => trans.Copyright || '',
    }
});
