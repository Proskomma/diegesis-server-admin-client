const makeServer = require('../src/lib/makeServer.js');
const {makeConfig} = require("../src/lib/makeConfig.js");
const {getText} = require("../src/lib/http.js");
const path = require('path');
const os = require('os');
const fse = require('fs-extra');

beforeAll(async () => {
    global.__dataDir__ = fse.mkdtempSync(path.join(os.tmpdir(), 'dgsServerTest'));
    global.__app__ = await makeServer(makeConfig({dataPath: global.__dataDir__, debug: true}));
    global.__server__ = await global.__app__.listen(2468);
})

afterAll(async () => {
    try {
        await global.__server__.close();
    } finally {
        fse.rmSync(global.__dataDir__, {recursive: true});
    }
})

async function doQuery(query) {
    const res = await getText(`http://localhost:2468/graphql?query=${query}`);
    if (res.data.errors) {
        console.log(`GQL returned errors: ${JSON.stringify(res.data.errors, null, 2)}`);
    }
    return res.data.data;
}

describe('Orgs', () => {

    it('Returns Name', async () => {
        const res = await doQuery('{ orgs { name } }');
        const names = res.orgs.map(o => o.name);
        expect(names).toContain("DBL");
        expect(names).toContain("DCS");
        expect(names).toContain("eBible");
        expect(names).toContain("Vachan");
    })

})

describe('Org', () => {

    it('Returns Name for eBible', async () => {
        const res = await doQuery('{ org(name:"eBible") { name } }');
        const org = res.org;
        expect(org.name).toEqual("eBible");
    });

    it('Returns null for unknown org', async () => {
        const res = await doQuery('{ org(name:"fBible") { name } }');
        const org = res.org;
        expect(org).toBeNull();
    })

    it('Returns nCatalogEntries', async () => {
        const res = await doQuery('{ org(name:"eBible") { nCatalogEntries } }');
        const org = res.org;
        expect(org.nCatalogEntries).toBeGreaterThan(0);
    })

    it('Returns nLocalTranslations', async () => {
        const res = await doQuery('{ org(name:"eBible") { nLocalTranslations } }');
        const org = res.org;
        expect(org.nLocalTranslations).toStrictEqual(0);
    })

})

    describe('CatalogEntries', () => {

        it('Returns Entries', async () => {
            const res = await doQuery(
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

