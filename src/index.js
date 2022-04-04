const {makeConfig, configSummary} = require("./lib/makeConfig.js");
const checkCli = require("./lib/checkCli.js");
const makeServer = require("./lib/makeServer.js");

// Build config object
let config;
const providedConfig = checkCli();
config = makeConfig(providedConfig);

// Start listening
makeServer(config).then(app => {
    app.listen(config.port, () => {
        console.log(configSummary(config));
    })
});
