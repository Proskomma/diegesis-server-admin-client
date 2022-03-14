import axios from 'axios';

async function getEBibleTranslations() {

    const axiosInstance = axios.create({});
    axiosInstance.defaults.headers = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
    };
    const catalogResponse = await axiosInstance.request(
        {
            method: "get",
            responseType: 'text',
            "url": `https://ebible.org/Scriptures/translations.csv`,
            "validateStatus": false,
        }
    );

    const catalogRows = catalogResponse.data.split('\n')
        .map(r => r.slice(1, r.length - 1))
        .map(r => r.split(/", ?"/));

    const headers = catalogRows[0];
    const catalog = catalogRows.slice(1).map(
        r => {
            const ret = {};
            headers.map((h, n) => ret[h] = r[n]);
            return ret;
        }
    )

    return catalog;
}

export { getEBibleTranslations }
