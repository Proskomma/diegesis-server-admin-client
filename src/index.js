import path from 'path';
import express from 'express';
import {ApolloServer} from 'apollo-server-express'
import cors from 'cors';
import helmet from "helmet";
import appRootPath from "app-root-path";

const appRoot = appRootPath.toString();
import gqlSchema from './graphql/schema/index.js';
import makeResolvers from './graphql/resolvers/index.js';
import {makeConfig} from "./lib/makeConfig.js";
import checkCli from "./lib/checkCli.js";
import doCron from './lib/cron.js';

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

// DIY GraphQL form
app.get('/gql_form', (req, res) => {
    res.sendFile(path.resolve(appRoot, 'src', 'html', 'gql_form.xhtml'));
})

// Apollo Server
const resolvers = await makeResolvers(config.orgs);
const server = new ApolloServer({
    typeDefs: gqlSchema,
    resolvers,
    debug: config.debug,
});

// Maybe start cron
if (config.cronFrequency !== 'never') {
    doCron(config);
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
