const makeServer = require('../src/lib/makeServer.js');
const {makeConfig} = require("../src/lib/makeConfig.js");
const {getText} = require("../src/lib/http.js");

beforeAll(async () => {
    global.__app__ = await makeServer(makeConfig({}));
    global.__server__ = await global.__app__.listen(2468);
})

afterAll(async () => {
    await global.__server__.close();
})

async function doQuery(query) {
    const res = await getText(`http://localhost:2468/graphql?query=${query}`);
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
