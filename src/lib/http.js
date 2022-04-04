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

module.exports = { getBuffer, getText };
