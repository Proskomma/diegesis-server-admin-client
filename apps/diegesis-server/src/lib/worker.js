const {parentPort, workerData} = require("node:worker_threads");

parentPort.on("message", data => {
    postMessage(data);
});
