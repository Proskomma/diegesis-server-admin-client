const axios = require("axios");

const getBuffer = async url => {
    const axiosInstance = axios.create({});
    axiosInstance.defaults.headers = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
    };
    const downloadResponse = await axiosInstance.request(
        {
            method: "get",
            responseType: 'arraybuffer',
            url,
            "validateStatus": false,
        }
    );
    if (downloadResponse.status !== 200) {
        throw new Error(`Attempt to download URL ${url} as buffer returned status ${downloadResponse.status}`);
    }
    return downloadResponse;
}

const getText = async url => {
    const axiosInstance = axios.create({});
    axiosInstance.defaults.headers = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
    };
    const downloadResponse = await axiosInstance.request(
        {
            method: "get",
            responseType: 'text',
            url,
            "validateStatus": false,
        }
    );
    if (downloadResponse.status !== 200) {
        throw new Error(`Attempt to download URL ${url} as text returned status ${downloadResponse.status}`);
    }
    return downloadResponse;
}

const postText = async (url, payload) => {
    const axiosInstance = axios.create({});
    axiosInstance.defaults.headers = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
    };
    const downloadResponse = await axiosInstance.request(
        {
            method: "post",
            responseType: 'text',
            url,
            data: payload,
            "validateStatus": false,
        }
    );
    if (downloadResponse.status !== 200) {
        throw new Error(`Attempt to POST to ${url} as text returned status ${downloadResponse.status}`);
    }
    return downloadResponse;
}

// For tests
async function doQuery(port, query) {
    const res = await postText(`http://localhost:${port}/graphql`, {query});
    if (res.data.errors) {
        console.log(`GQL returned errors: ${JSON.stringify(res.data.errors, null, 2)}`);
    }
    return res.data.data;
}

async function doMutation(port, query) {
    const axiosInstance = axios.create({});
    axiosInstance.defaults.headers = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Type': 'application/json',
    };
    const downloadResponse = await axiosInstance.post(
        `http://localhost:${port}/graphql`,
        {query: `mutation ${query}`},
        {
            responseType: 'text',
            "validateStatus": false,
        }
    );
    if (downloadResponse.status !== 200) {
        throw new Error(`GQL mutation POST returned status ${downloadResponse.status}`);
    }
    return downloadResponse.data.data;
}

module.exports = { getBuffer, getText, postText, doQuery, doMutation };
