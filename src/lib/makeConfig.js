const fse = require('fs-extra');
const appRootPath = require("app-root-path");
const appRoot = appRootPath.toString();

// CLI error helper function
const path = require("path");
const croak = msg => {
    const usageMessage = `%msg%\nUSAGE: node src/index.js [configFilePath]`
    console.log(usageMessage.replace('%msg%', msg));
    process.exit(1);
}

// Default config - override by passing config JSON file
const defaultConfig = {
    port: 2468,
    dataPath: path.resolve(appRoot, 'data'),
    useCors: false,
    debug: false,
    cronFrequency: 'never',
    orgs: [], // Empty array means 'all',
    verbose: false
}

const cronOptions = {
    '1 min': '* * * * *',
    '5 min': '*/5 * * * *',
    '15 min': '*/5 * * * *',
    '1 hr': '* * * *',
    '4 hr': '*/4 * * *',
    '8 hr': '*/8 * * *',
    '12 hr': '*/12 * * *',
    '1 day': '* * *',
    '7 day': '*/7 * *',
};


function makeConfig(providedConfig) {
    const config = defaultConfig;
    if (providedConfig.port) {
        if (
            typeof providedConfig.port !== 'number' ||
            providedConfig.port.toString().includes('.') ||
            providedConfig.port < 1 ||
            providedConfig.port > 65535) {
            croak(`ERROR: port should be an integer between 1 and 65535, not '${providedConfig.port}'`);
        }
        config.port = providedConfig.port;
    }
    if (providedConfig.dataPath) {
        if (
            typeof providedConfig.dataPath !== 'string') {
            croak(`ERROR: dataPath should be a string, not '${providedConfig.dataPath}'`);
        }
        const fqPath = path.resolve(providedConfig.dataPath);
        if (!fse.existsSync(fqPath) || !fse.lstatSync(fqPath).isDirectory()) {
            croak(`ERROR: dataPath '${fqPath}' does not exist or is not a directory`);
        }
        config.dataPath = fqPath;
    }
    if (providedConfig.staticPath) {
        if (
            typeof providedConfig.staticPath !== 'string') {
            croak(`ERROR: staticPath, if present, should be a string, not '${providedConfig.staticPath}'`);
        }
        const fqPath = path.resolve(providedConfig.staticPath);
        if (!fse.existsSync(fqPath) || !fse.lstatSync(fqPath).isDirectory()) {
            croak(`ERROR: staticPath '${fqPath}' does not exist or is not a directory`);
        }
        config.staticPath = fqPath;
    }
    if ('debug' in providedConfig) {
        if (typeof providedConfig.debug !== 'boolean') {
            croak(`ERROR: debug should be boolean, not ${typeof providedConfig.debug}`);
        }
        config.debug = providedConfig.debug;
    }
    if ('useCors' in providedConfig) {
        if (typeof providedConfig.useCors !== 'boolean') {
            croak(`ERROR: useCors should be boolean, not ${typeof providedConfig.useCors}`);
        }
        config.useCors = providedConfig.useCors;
    }
    if ('cronFrequency' in providedConfig) {
        if (providedConfig.cronFrequency !== 'never' && !(providedConfig.cronFrequency in cronOptions)) {
            croak(`ERROR: unknown cronFrequency option '${providedConfig.cronFrequency}' - should be one of never, ${Object.keys(cronOptions).join(', ')}`);
        }
        config.cronFrequency = providedConfig.cronFrequency;
    }
    if ('orgs' in providedConfig) {
        if (!Array.isArray(providedConfig.orgs)) {
            croak(`ERROR: orgs should be an array, not '${providedConfig.orgs}'`);
        }
        config.orgs = providedConfig.orgs;
    }
    if ('verbose' in providedConfig) {
        if (typeof providedConfig.verbose !== 'boolean') {
            croak(`ERROR: verbose should be boolean, not ${typeof providedConfig.verbose}`);
        }
        config.verbose = providedConfig.verbose;
    }
    return config;
}

const configSummary = config => `  Listening on port ${config.port}
    Data directory is ${config.dataPath}
    ${config.staticPath ? `Static directory is ${config.staticPath}` : "No static directory"}
    Debug ${config.debug ? "en" : "dis"}abled
    Verbose ${config.verbose ? "en" : "dis"}abled
    CORS ${config.useCors ? "en" : "dis"}abled
    Cron ${config.cronFrequency === 'never' ? "disabled" : `every ${config.cronFrequency}`}`

module.exports = {makeConfig, cronOptions, configSummary};
