// CLI error helper function
const croak = msg => {
    const usageMessage = `%msg%\nUSAGE: node src/index.js [configFilePath]`
    console.log(usageMessage.replace('%msg%', msg));
    process.exit(1);
}

// Default config - override by passing config JSON file
const defaultConfig = {
    port: 2468,
    useCors: true,
    debug: true,
    cronFrequency: 'never',
    orgs: [] // Empty array means 'all'
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
    return config;
}

export {makeConfig, cronOptions};
