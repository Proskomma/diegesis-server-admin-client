import path from 'path';
import fse from 'fs-extra';
import express from 'express';
import { ApolloServer } from 'apollo-server-express'
import cors from 'cors';

import gqlSchema from './graphql/schema/index.js';
import gqlResolvers from './graphql/resolvers/index.js';
import {getEBibleTranslationsCatalog, getEBibleContent} from "./orgHandlers/eBible/startup.js";

// Config Constants
const SERVERLABEL = "Diegesis Server"
const PORT = process.env.PORT || 2468;
const USECORS = true;

// Get EBible Translations Info
const translations = await getEBibleTranslationsCatalog();
fse.writeJsonSync(
    path.resolve('..', 'static', 'ebible', 'catalog.json'),
    translations
);

/*
for (const translation of translations) {
    await getEBibleContent(translation.downloadURL);
}
*/

// Express
const app = express();
app.use(express.static('../static'));
if (USECORS) {
    app.use(cors());
}

app.get('/', (req, res) => {
    res.sendFile(path.resolve('html', 'index.xhtml'));
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
