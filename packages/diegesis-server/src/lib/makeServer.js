const path = require("path");
const fse = require('fs-extra');
const express = require("express");
const helmet = require("helmet");
const {ApolloServer} = require("apollo-server-express");
const {mergeTypeDefs} = require('@graphql-tools/merge')
const morgan = require('morgan');
const winston = require('winston');
const makeResolvers = require("../graphql/resolvers/index.js");
const {scalarSchema, querySchema, mutationSchema} = require("../graphql/schema/index.js");
const doCron = require("./cron.js");

const appRootPath = require("app-root-path");
const appRoot = appRootPath.toString();

async function makeServer(config) {
    // Express
    const app = express();
    app.use(helmet({
        crossOriginEmbedderPolicy: !config.debug,
        contentSecurityPolicy: !config.debug,
    }));
    if (config.useCors) {
        app.all('*', (req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, PATCH, OPTIONS');
            res.header('Access-Control-Allow-Headers', '*');
            res.header('Access-Control-Allow-Credentials', true);
            next();
        });
    }
    // Maybe static
    if (config.staticPath) {
        app.use(express.static(config.staticPath));
    }

    // Maybe copy local translations
    if (config.localUsxPath) {
        const targetDir = path.join(config.dataPath, 'localusx');
        if (fse.pathExistsSync(targetDir)) {
            fse.removeSync(targetDir);
        }
        fse.copySync(config.localUsxPath, targetDir);
    }

    // Maybe HTML endpoints
    if (config.debug) {
        // Hello world index
        app.get('/', (req, res) => {
            res.sendFile(path.resolve(appRoot, 'src', 'html', 'index.xhtml'));
        });

        // DIY GraphQL form
        app.get('/gql_form', (req, res) => {
            res.sendFile(path.resolve(appRoot, 'src', 'html', 'gql_form.xhtml'));
        });
    }

    // Maybe log access using Morgan
    if (config.logAccess) {
        if (config.accessLogPath) {
            const accessLogStream = fse.createWriteStream(config.accessLogPath, { flags: 'a' });
            app.use(
                morgan(
                    config.logFormat,
                    { stream: accessLogStream }
                )
            );
        } else {
            app.use(
                morgan(config.logFormat)
            );
        }
    }

    // Log incidents using Winston
    config.incidentLogger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [new winston.transports.Console()],
    });

    // Apollo server
    const resolvers = await makeResolvers(config);
    const server = new ApolloServer({
        typeDefs: mergeTypeDefs(
            config.includeMutations ?
                [scalarSchema, querySchema, mutationSchema] :
                [scalarSchema, querySchema]
        ),
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
    return app;
}

module.exports = makeServer;
