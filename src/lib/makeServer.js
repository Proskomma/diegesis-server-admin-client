const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const makeResolvers = require("../graphql/resolvers/index.js");
const {ApolloServer} = require("apollo-server-express");
const gqlSchema = require("../graphql/schema/index.js");
const doCron = require("./cron.js");

async function makeServer (config) {
    // Express
    const app = express();
    app.use(helmet({
        crossOriginEmbedderPolicy: !config.debug,
        contentSecurityPolicy: !config.debug,
    }));
    if (config.useCors) {
        app.use(cors());
    }
    // Maybe HTML endpoints
    if (config.debug) {
        app.use(express.static('../static'));
        // Hello world index
        app.get('/', (req, res) => {
            res.sendFile(path.resolve(appRoot, 'src', 'html', 'index.xhtml'));
        });

        // DIY GraphQL form
        app.get('/gql_form', (req, res) => {
            res.sendFile(path.resolve(appRoot, 'src', 'html', 'gql_form.xhtml'));
        });
    }

    // Apollo server
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
    return app;
}

module.exports = makeServer;
