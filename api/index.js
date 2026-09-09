import { ApolloServer } from '@apollo/server';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
});

// Define app at the top level so we can export it at the bottom
let app;

// Vercel automatically sets process.env.VERCEL to true in their cloud
if (process.env.VERCEL) {
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;
  const { expressMiddleware } = await import('@apollo/server/express4');
  
  // Only manually start the server when using Express
  await server.start();
  
  app = express();
  app.use(cors(), express.json(), expressMiddleware(server));
} else {
  const { startStandaloneServer } = await import('@apollo/server/standalone');
  
  // startStandaloneServer handles the server.start() initialization automatically
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });
  console.log(`🚀 Local dev server ready at ${url}`);
}

// Export the app for Vercel's serverless engine
export default app;