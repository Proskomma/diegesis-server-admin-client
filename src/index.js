import path from 'path';
import express from 'express';
import { ApolloServer } from 'apollo-server-express'
import cors from 'cors';

import gqlSchema from './graphql/schema/index.js';
import gqlResolvers from './graphql/resolvers/index.js';
import {getEBibleTranslations} from "./lib/startup.js";

const SERVERLABEL = "Diegesis Server"
const PORT = process.env.PORT || 2468;
const USECORS = true;

const translations = await getEBibleTranslations();
console.log(translations);

const server = new ApolloServer({
  typeDefs: gqlSchema,
  resolvers: gqlResolvers,
})

const app = express();
app.use(express.static('../static'));
if (USECORS) {
    app.use(cors());
}

app.get('/', (req, res) => {
    res.sendFile(path.resolve('html', 'index.xhtml'));
})

await server.start();

server.applyMiddleware({ app });

app.listen(PORT, () => {
  console.log(`${SERVERLABEL}\n   Listening on port ${PORT}\n   CORS ${USECORS? "en" : "dis"}abled`);
})
