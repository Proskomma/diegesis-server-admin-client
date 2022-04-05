const makeServer = require('../src/lib/makeServer.js');
const {makeConfig} = require("../src/lib/makeConfig.js");
const {doQuery, doMutation} = require("../src/lib/http.js");
const path = require('path');
const os = require('os');
const fse = require('fs-extra');

beforeEach(async () => {
    global.__dataDir__ = fse.mkdtempSync(path.join(os.tmpdir(), 'dgsServerTest'));
    global.__app__ = await makeServer(makeConfig({dataPath: global.__dataDir__, debug: true}));
    global.__server__ = await global.__app__.listen(2468);
})

afterEach(async () => {
    try {
        await global.__server__.close();
    } finally {
        fse.rmSync(global.__dataDir__, {recursive: true});
    }
})

describe('Read-only', () => {

    it('Returns Name', async () => {
        const res = await doQuery(2468, '{ orgs { name } }');
        const names = res.orgs.map(o => o.name);
        expect(names).toContain("DBL");
        expect(names).toContain("DCS");
        expect(names).toContain("eBible");
        expect(names).toContain("Vachan");
    })

    it('Returns Name for eBible', async () => {
        const res = await doQuery(2468, '{ org(name:"eBible") { name } }');
        const org = res.org;
        expect(org.name).toEqual("eBible");
    });

    it('Returns null for unknown org', async () => {
        const res = await doQuery(2468, '{ org(name:"fBible") { name } }');
        const org = res.org;
        expect(org).toBeNull();
    })

    it('Returns nCatalogEntries', async () => {
        const res = await doQuery(2468, '{ org(name:"eBible") { nCatalogEntries } }');
        const org = res.org;
        expect(org.nCatalogEntries).toBeGreaterThan(0);
    })

    it('Returns nLocalTranslations', async () => {
        const res = await doQuery(2468, '{ org(name:"eBible") { nLocalTranslations } }');
        const org = res.org;
        expect(org.nLocalTranslations).toStrictEqual(0);
    })

    it('Returns catalogEntries', async () => {
        const res = await doQuery(
            2468,
            '{ org(name:"eBible") { nCatalogEntries catalogEntries { id languageCode title hasLocalUsfm hasLocalUsx hasLocalSuccinct } } }'
        );
        const org = res.org;
        expect(org.catalogEntries.length).toStrictEqual(org.nCatalogEntries);
        expect(org.catalogEntries[1]).toHaveProperty('languageCode');
        expect(org.catalogEntries[1]).toHaveProperty('title');
        expect(org.catalogEntries[1]).toHaveProperty('hasLocalUsfm');
        expect(org.catalogEntries[1]).toHaveProperty('hasLocalUsx');
        expect(org.catalogEntries[1]).toHaveProperty('hasLocalSuccinct');
    });

})

describe('eBible translations', () => {

    it('Does Fetch', async () => {
        let res = await doQuery(2468, '{ org(name:"eBible") { nLocalTranslations } }');
        let org = res.org;
        expect(org.nLocalTranslations).toStrictEqual(0);
        res = await doMutation(2468, '{fetchUsfm(org:"eBible" translationId:"fraLSG")}');
        expect(res.fetchUsfm).toStrictEqual(true);
        res = await doQuery(
            2468,
            '{ org(name:"eBible") { nLocalTranslations localTranslation(id:"fraLSG") {hasUsfm hasSuccinct hasUsfmBookCode(code:"PHM") usfmForBookCode(code:"PHM")} } }');
        org = res.org;
        expect(org.nLocalTranslations).toStrictEqual(1);
        expect(org.localTranslation.hasUsfm).toStrictEqual(true);
        expect(org.localTranslation.hasSuccinct).toStrictEqual(false);
        expect(org.localTranslation.hasUsfmBookCode).toStrictEqual(true);
        expect(org.localTranslation.usfmForBookCode).toContain("PHM");
    })

});
/*
describe('DCS translations', () => {

    it('Does Fetch', async () => {
        let res = await doQuery(2468, '{ org(name:"DCS") { nLocalTranslations } }');
        let org = res.org;
        expect(org.nLocalTranslations).toStrictEqual(0);
        res = await doMutation(2468, '{fetchUsfm(org:"DCS" translationId:"17717")}');
        expect(res.fetchUsfm).toStrictEqual(true);
        res = await doQuery(
            2468,
            '{ org(name:"DCS") { nLocalTranslations localTranslation(id:"17717") {hasUsfm hasSuccinct hasUsfmBookCode(code:"PHM") usfmForBookCode(code:"PHM")} } }');
        org = res.org;
        expect(org.nLocalTranslations).toStrictEqual(1);
        expect(org.localTranslation.hasUsfm).toStrictEqual(true);
        expect(org.localTranslation.hasSuccinct).toStrictEqual(false);
        expect(org.localTranslation.hasUsfmBookCode).toStrictEqual(true);
        expect(org.localTranslation.usfmForBookCode).toContain("PHM");
    })

});

describe('DBL translations', () => {

    it('Does Fetch', async () => {
        let res = await doQuery(2468, '{ org(name:"DBL") { nLocalTranslations } }');
        let org = res.org;
        expect(org.nLocalTranslations).toStrictEqual(0);
        res = await doMutation(2468, '{fetchUsx(org:"DBL" translationId:"de4e12af7f28f599")}');
        expect(res.fetchUsx).toStrictEqual(true);
        res = await doQuery(
            2468,
            '{ org(name:"DBL") { nLocalTranslations localTranslation(id:"de4e12af7f28f599") {hasUsx hasSuccinct hasUsxBookCode(code:"PHM") usxForBookCode(code:"PHM")} } }');
        org = res.org;
        expect(org.nLocalTranslations).toStrictEqual(1);
        expect(org.localTranslation.hasUsx).toStrictEqual(true);
        expect(org.localTranslation.hasSuccinct).toStrictEqual(false);
        expect(org.localTranslation.hasUsxBookCode).toStrictEqual(true);
        expect(org.localTranslation.usxForBookCode).toContain("PHM");
    })

});

describe('Vachan translations', () => {

    it('Does Fetch', async () => {
        let res = await doQuery(2468, '{ org(name:"Vachan") { nLocalTranslations } }');
        let org = res.org;
        expect(org.nLocalTranslations).toStrictEqual(0);
        res = await doMutation(2468, '{fetchUsfm(org:"Vachan" translationId:"pa_IRV_5_bible")}');
        expect(res.fetchUsfm).toStrictEqual(true);
        res = await doQuery(
            2468,
            '{ org(name:"Vachan") { nLocalTranslations localTranslation(id:"pa_IRV_5_bible") {hasUsfm hasSuccinct hasUsfmBookCode(code:"PHM") usfmForBookCode(code:"PHM")} } }');
        org = res.org;
        expect(org.nLocalTranslations).toStrictEqual(1);
        expect(org.localTranslation.hasUsfm).toStrictEqual(true);
        expect(org.localTranslation.hasSuccinct).toStrictEqual(false);
        expect(org.localTranslation.hasUsfmBookCode).toStrictEqual(true);
        expect(org.localTranslation.usfmForBookCode).toContain("PHM");
    })

});
*/
