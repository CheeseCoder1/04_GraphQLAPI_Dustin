import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import cors from 'cors';

import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
});

let app;

if (process.env.VERCEL) {
  await server.start();
  app = express();
  app.use(cors(), express.json(), expressMiddleware(server));
} else {
  const { startStandaloneServer } = await import('@apollo/server/standalone');
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });
  console.log(`🚀 Local dev server ready at ${url}`);
}

export default app;