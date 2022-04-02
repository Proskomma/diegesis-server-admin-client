import path from 'path';
import fse from 'fs-extra';
import express from 'express';
import {ApolloServer} from 'apollo-server-express'
import cors from 'cors';
import helmet from "helmet";
import cron from 'node-cron';
import appRootPath from "app-root-path";

const appRoot = appRootPath.toString();
import gqlSchema from './graphql/schema/index.js';
import makeResolvers from './graphql/resolvers/index.js';
import {makeConfig, cronOptions} from "./lib/makeConfig.js";
import checkCli from "./lib/checkCli.js";

// Build config object
const providedConfig = checkCli();
const config = makeConfig(providedConfig);

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

// Maybe start cron
if (config.cronFrequency !== 'never') {
    cron.schedule(
        cronOptions[config.cronFrequency],
        () => {
            console.log('tick');
        }
    );
}

// Start server
await server.start();
server.applyMiddleware({app});
app.listen(config.port, () => {
    console.log(
        `  Listening on port ${config.port}
    CORS ${config.useCors ? "en" : "dis"}abled
    Debug ${config.debug ? "en" : "dis"}abled
    Cron ${config.cronFrequency === 'never' ? "disabled" : `every ${config.cronFrequency}`}`
    );
})
