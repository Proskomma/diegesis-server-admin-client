import path from 'path';
import fse from 'fs-extra';
import express from 'express';
import { ApolloServer } from 'apollo-server-express'
import cors from 'cors';

import gqlSchema from './graphql/schema/index.js';
import gqlResolvers from './graphql/resolvers/index.js';
import appRootPath from "app-root-path";
const appRoot = appRootPath.toString();

// Config Constants
const SERVERLABEL = "Diegesis Server"
const PORT = process.env.PORT || 2468;
const USECORS = true;

// Express
const app = express();
app.use(express.static('../static'));
if (USECORS) {
    app.use(cors());
}

app.get('/', (req, res) => {
    res.sendFile(path.resolve(appRoot, 'src', 'html', 'index.xhtml'));
})

// Apollo Server
const server = new ApolloServer({
    typeDefs: gqlSchema,
    resolvers: gqlResolvers,
})
await server.start();
server.applyMiddleware({ app });

// Listen
app.listen(PORT, () => {
  console.log(`${SERVERLABEL}\n   Listening on port ${PORT}\n   CORS ${USECORS? "en" : "dis"}abled`);
})
