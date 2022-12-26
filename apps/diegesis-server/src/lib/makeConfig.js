const fse = require('fs-extra');
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
    deleteGenerated: false,
    nWorkers: 1,
    sessionTimeoutInMins: 15,
}

const cronOptions = {
    '1 min': '* * * * *',
    '5 min': '*/5 * * * *',
    '10 min': '*/10 * * * *',
    '15 min': '*/15 * * * *',
    '20 min': '*/20 * * * *',
    '30 min': '*/30 * * * *',
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
        croak('ERROR: the staticPath config option has been replaced by staticPaths');
    }
    if (providedConfig.staticPaths) {
        if (!Array.isArray(providedConfig.staticPaths)) {
            croak(`ERROR: staticPaths, if present, should be an array, not '${providedConfig.staticPaths}'`);
        }
        let specs = [];
        for (const staticPathSpec of providedConfig.staticPaths) {
            const spec = {};
            if (typeof staticPathSpec !== 'object' || Array.isArray(staticPathSpec)) {
                croak(`ERROR: static path spec should be an object, not '${JSON.stringify(staticPathSpec)}'`);
            }
            if (!staticPathSpec.path) {
                croak(`ERROR: static path spec must contain a path: '${JSON.stringify(staticPathSpec)}'`);
            }
            if (!staticPathSpec.url) {
                croak(`ERROR: static path spec must contain a url: '${JSON.stringify(staticPathSpec)}'`);
            }
            const fqPath = path.resolve(staticPathSpec.path);
            if (!fse.existsSync(fqPath) || !fse.lstatSync(fqPath).isDirectory()) {
                croak(`ERROR: static path '${fqPath}' does not exist or is not a directory`);
            }
            spec.path = fqPath;
            if (!staticPathSpec.url.startsWith('/')) {
                croak(`ERROR: static url '${staticPathSpec.url}' does not begin with a /`);
            }
            spec.url = staticPathSpec.url;
            if (staticPathSpec.redirectTarget) {
                const fqPath = path.resolve(staticPathSpec.redirectTarget);
                if (!fse.existsSync(fqPath)) {
                    croak(`ERROR: redirectTarget '${fqPath}' does not exist`);
                }
                spec.redirectTarget = fqPath;
            }
            spec.redirects = [];
            if (staticPathSpec.redirects) {
                if (!staticPathSpec.redirectTarget) {
                    croak(`ERROR: cannot use 'redirects' without 'redirectTarget' in staticPaths`);
                }
                if (!Array.isArray(staticPathSpec.redirects)) {
                    croak(`ERROR: static path redirects, if present, should be an array, not '${staticPathSpec.redirects}'`);
                }
                for (const redirect of staticPathSpec.redirects) {
                    if (typeof redirect !== 'string') {
                        croak(`ERROR: redirect elements should be strings, not '${redirect}'`);
                    }
                    if (!redirect.startsWith('/')) {
                        croak(`ERROR: redirect elements should start with '/' (from '${redirect}')`);
                    }
                }
                spec.redirects = staticPathSpec.redirects;
            }
            specs.push(spec);
        }
        config.staticPaths = specs;
    }
    if (providedConfig.redirectToRoot) {
        croak("ERROR: redirectToRoot has been replaced by 'redirects' inside static path specs");
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
    if ('superusers' in providedConfig) {
        if (typeof providedConfig.superusers !== 'object' || Array.isArray(providedConfig.superusers)) {
            croak(`ERROR: superusers, if present, should be an object, not '${JSON.stringify(providedConfig.superusers)}'`);
        }
        for (const password of Object.values(providedConfig.superusers)) {
            if (typeof password !== 'string') {
                croak(`ERROR: superuser password hash should be a string, not '${JSON.stringify(providedConfig.superusers)}'`)
            }
        }
        config.superusers = providedConfig.superusers;
    } else {
        config.superusers = {};
    }
    if ('sessionTimeoutInMins' in providedConfig) {
        if (
            typeof providedConfig.sessionTimeoutInMins !== 'number' ||
            !cronOptions[`${providedConfig.sessionTimeoutInMins} min`]) {
            croak(`ERROR: sessionTimeoutInMins should be 1, 5, 10, 15, 20 or 30, not '${providedConfig.sessionTimeoutInMins}'`);
        }
        config.sessionTimeoutInMins = providedConfig.sessionTimeoutInMins;
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
    if (providedConfig.nWorkers) {
        if (
            typeof providedConfig.nWorkers !== 'number' ||
            providedConfig.nWorkers.toString().includes('.') ||
            providedConfig.nWorkers < 1 ||
            providedConfig.nWorkers > 16) {
            croak(`ERROR: nWorkers should be an integer between 1 and 16, not '${providedConfig.nWorkers}'`);
        }
        config.nWorkers = providedConfig.nWorkers;
    }
    if ('deleteGenerated' in providedConfig) {
        if (typeof providedConfig.deleteGenerated !== 'boolean') {
            croak(`ERROR: deleteGenerated should be boolean, not ${typeof providedConfig.useCors}`);
        }
        config.deleteGenerated = providedConfig.deleteGenerated;
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

const staticDescription = specs => {
    return 'Static Paths:\n' +
        specs.map(
            sp =>
                `      serve '${sp.path}'\n        at '${sp.url}${sp.redirects.length > 1 ? "\n        redirecting " + sp.redirects.join(', ') + '\n          to ' + sp.redirectTarget + "'": ""}`
        ).join('\n')
}

const configSummary = config => `  Listening on ${config.hostName}:${config.port}
    Data directory is ${config.dataPath}
    ${config.staticPaths ? `${staticDescription(config.staticPaths)}` : "No static paths"}
    ${config.localUsfmPath ? `Local USFM copied from ${config.localUsfmPath}` : 'No local USFM copied'}
    ${config.localUsxPath ? `Local USX copied from ${config.localUsxPath}` : 'No local USX copied'}
    Debug ${config.debug ? "en" : "dis"}abled
    Verbose ${config.verbose ? "en" : "dis"}abled
    Access logging ${!config.logAccess ? "disabled" : `to ${config.accessLogPath || 'console'} in Morgan '${config.logFormat}' format`}
    CORS ${config.useCors ? "en" : "dis"}abled
    Mutations ${config.includeMutations ? "included" : "not included"}
    Cron ${config.cronFrequency === 'never' ? "disabled" : `every ${config.cronFrequency}
    ${config.nWorkers} worker thread${config.nWorkers === 1 ? "" : "s"}
    ${config.deleteGenerated ? "Delete all generated content" : "Delete lock files only"}
    ${Object.keys(config.superusers).length} superuser${Object.keys(config.superusers).length === 1 ? "" : "s"}
    ${Object.keys(config.superusers).length === 0 ? "" : `Session cookies expire after ${config.sessionTimeoutInMins} min`}
`}`

module.exports = {makeConfig, cronOptions, configSummary};
