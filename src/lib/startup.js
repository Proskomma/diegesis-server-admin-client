import axios from 'axios';

async function getEBibleTranslationsCatalog() {

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
    const catalog = catalogRows.slice(1)
        .map(
        r => {
            const ret = {};
            headers.forEach((h, n) => ret[h] = r[n]);
            ret.downloadURL = `https://eBible.org/Scriptures/${ret.translationId}_usfm.zip`;
            return ret;
        }
    )

    return catalog;
}

async function getEBibleContent(url) {
    const axiosInstance = axios.create({});
    axiosInstance.defaults.headers = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
    };
    const contentResponse = await axiosInstance.request({
        method: "get",
        responseType: 'text',
        "url": url,
        "validateStatus": false,
    });
    if (contentResponse.status === 200) {
        console.log(`${url} downloaded`)
        return contentResponse.data;
    } else {
        console.log(`${url} returned status code ${contentResponse.status}`);
        return null;
    }

}

export { getEBibleTranslationsCatalog, getEBibleContent }
