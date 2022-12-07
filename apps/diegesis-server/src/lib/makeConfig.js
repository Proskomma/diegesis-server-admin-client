const fse = require('fs-extra');
const appRootPath = require("app-root-path");
const path = require("path");
const appRoot = path.resolve(".");

// CLI error helper function

const croak = msg => {
    const usageMessage = `%msg%\nUSAGE: node src/index.js [configFilePath]`
    console.log(usageMessage.replace('%msg%', msg));
    process.exit(1);
}

// Default config - override by passing config JSON file
const defaultConfig = {
    hostName: 'localhost',
    port: 2468,
    dataPath: path.resolve(appRoot, 'data'),
    logAccess: false,
    logFormat: "combined",
    useCors: false,
    debug: false,
    cronFrequency: 'never',
    orgs: [], // Empty array means 'all',
    verbose: false,
    includeMutations: false,
    redirectToRoot: [],
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

const logFormatOptions = ["combined", "common", "dev", "short", "tiny"];

function makeConfig(providedConfig) {
    const config = defaultConfig;
    if (providedConfig.hostName) {
        if (
            typeof providedConfig.hostName !== 'string') {
            croak(`ERROR: hostName should be a string, not '${providedConfig.port}'`);
        }
        config.hostName = providedConfig.hostName;
    }
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
    if (providedConfig.redirectToRoot) {
        if (!providedConfig.staticPath) {
            croak(`ERROR: redirectToRoot present but staticPath absent`);
        }
        if (!Array.isArray(providedConfig.redirectToRoot)) {
            croak(`ERROR: redirectToRoot, if present, should be an array, not '${providedConfig.redirectToRoot}'`);
        }
        for (const redirect of providedConfig.redirectToRoot) {
            if (typeof redirect !== 'string') {
                croak(`ERROR: redirectToRoot elements should be strings, not '${redirect}'`);
            }
            if (!redirect.startsWith('/')) {
                croak(`ERROR: redirectToRoot elements should start with '/' (from '${redirect}')`);
            }
        }
        config.redirectToRoot = providedConfig.redirectToRoot;
    }
    if (providedConfig.localUsfmPath) {
        if (
            typeof providedConfig.localUsfmPath !== 'string') {
            croak(`ERROR: localUsfmPath, if present, should be a string, not '${providedConfig.localUsfmPath}'`);
        }
        const fqPath = path.resolve(providedConfig.localUsfmPath);
        if (!fse.existsSync(fqPath) || !fse.lstatSync(fqPath).isDirectory()) {
            croak(`ERROR: localUsfmPath '${fqPath}' does not exist or is not a directory`);
        }
        config.localUsfmPath = fqPath;
    }
    if (providedConfig.localUsxPath) {
        if (
            typeof providedConfig.localUsxPath !== 'string') {
            croak(`ERROR: localUsxPath, if present, should be a string, not '${providedConfig.localUsxPath}'`);
        }
        const fqPath = path.resolve(providedConfig.localUsxPath);
        if (!fse.existsSync(fqPath) || !fse.lstatSync(fqPath).isDirectory()) {
            croak(`ERROR: localUsxPath '${fqPath}' does not exist or is not a directory`);
        }
        config.localUsxPath = fqPath;
    }
    if ('debug' in providedConfig) {
        if (typeof providedConfig.debug !== 'boolean') {
            croak(`ERROR: debug should be boolean, not ${typeof providedConfig.debug}`);
        }
        config.debug = providedConfig.debug;
    }
    if ('logAccess' in providedConfig) {
        if (typeof providedConfig.logAccess !== 'boolean') {
            croak(`ERROR: logAccess should be boolean, not ${typeof providedConfig.logAccess}`);
        }
        config.logAccess = providedConfig.logAccess;
    }
    if ('logFormat' in providedConfig) {
        if (!logFormatOptions.includes(providedConfig.logFormat)) {
            croak(`ERROR: unknown logFormat option '${providedConfig.logFormat}' - should be one of ${logFormatOptions.join(', ')}`);
        }
        config.logFormat = providedConfig.logFormat;
    }
    if (providedConfig.accessLogPath) {
        if (
            typeof providedConfig.accessLogPath !== 'string') {
            croak(`ERROR: accessLogPath, if present, should be a string, not '${providedConfig.accessLogPath}'`);
        }
        config.accessLogPath = path.resolve(providedConfig.accessLogPath);
    }
    if ('includeMutations' in providedConfig) {
        if (typeof providedConfig.includeMutations !== 'boolean') {
            croak(`ERROR: includeMutaitons should be boolean, not ${typeof providedConfig.includeMutations}`);
        }
        config.includeMutations = providedConfig.includeMutations;
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

const configSummary = config => `  Listening on ${config.hostName}:${config.port}
    Data directory is ${config.dataPath}
    ${config.staticPath ? `Static directory is ${config.staticPath}` : "No static directory"}
    ${config.redirectToRoot.length > 0 ? `Root Redirects on ${config.redirectToRoot.join(', ')}` : "No Root Redirects"}
    ${config.localUsfmPath ? `Local USFM copied from ${config.localUsfmPath}` : 'No local USFM copied'}
    ${config.localUsxPath ? `Local USX copied from ${config.localUsxPath}` : 'No local USX copied'}
    Debug ${config.debug ? "en" : "dis"}abled
    Verbose ${config.verbose ? "en" : "dis"}abled
    Access logging ${!config.logAccess ? "disabled" : `to ${config.accessLogPath || 'console'} in Morgan '${config.logFormat}' format`}
    CORS ${config.useCors ? "en" : "dis"}abled
    Mutations ${config.includeMutations ? "included" : "not included"}
    Cron ${config.cronFrequency === 'never' ? "disabled" : `every ${config.cronFrequency}
`}`

module.exports = {makeConfig, cronOptions, configSummary};
