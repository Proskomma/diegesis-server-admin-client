import path from 'path';
import fse from 'fs-extra';
import express from 'express';
import { ApolloServer } from 'apollo-server-express'
import cors from 'cors';
import helmet from "helmet";
import appRootPath from "app-root-path";
const appRoot = appRootPath.toString();
import gqlSchema from './graphql/schema/index.js';
import makeResolvers from './graphql/resolvers/index.js';

// Default config - override by passing config JSON file
const config = {
    port: 2468,
    useCors: true,
    debug: true,
    orgs: [] // Empty array means 'all'
}

// CLI error helper function
const croak = msg => {
    console.log(usageMessage.replace('%msg%', msg));
    process.exit(1);
}

// Check CLI invocation
const usageMessage = `%msg%\nUSAGE: node src/index.js [configFilePath]`
if (process.argv.length < 2 || process.argv.length > 3) {
    croak('ERROR: Wrong number of arguments');
}

// Get config file if provided; merge values into default config
if (process.argv.length === 3) {
    const absPath = path.resolve(process.argv[2]);
    if (!fse.pathExistsSync(absPath)) {
        croak(`ERROR: Config file path '${absPath}' does not exist`);
    }
    let providedConfig;
    try {
        providedConfig = fse.readJsonSync(absPath);
    } catch (err) {
        croak(`ERROR: Could not read and parse JSON file '${absPath}'`);
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
    if ('orgs' in providedConfig) {
        if (!Array.isArray(providedConfig.orgs)) {
            croak(`ERROR: orgs should be an array, not '${providedConfig.orgs}'`);
        }
        config.orgs = providedConfig.orgs;
    }
}

// Express
const app = express();
app.use(helmet());
app.use(express.static('../static'));
if (config.useCors) {
    app.use(cors());
}

// Hello world index
app.get('/', (req, res) => {
    res.sendFile(path.resolve(appRoot, 'src', 'html', 'index.xhtml'));
})

// Apollo Server
const server = new ApolloServer({
    typeDefs: gqlSchema,
    resolvers: await makeResolvers(config.orgs),
    debug: config.debug,
})

// Start server
await server.start();
server.applyMiddleware({ app });
app.listen(config.port, () => {
  console.log(
      `  Listening on port ${config.port}
    CORS ${config.useCors ? "en" : "dis"}abled
    Debug ${config.debug ? "en" : "dis"}abled`);
})
