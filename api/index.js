import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';

import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, 
});

await server.start();

app.use('/graphql', cors(), express.json(), expressMiddleware(server));

export default app;