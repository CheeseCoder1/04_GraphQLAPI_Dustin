import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
});

let handler;

if (process.env.VERCEL) {
  // For Vercel Serverless: Start server once and map standard HTTP incoming requests
  await server.start();
  
  handler = async (req, res) => {
    // Handle CORS headers so Apollo Sandbox can talk to it
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, apollo-require-preflight');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Parse incoming request body for GraphQL operations
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    
    let jsonBody = {};
    try {
      jsonBody = body ? JSON.parse(body) : {};
    } catch (e) {
      jsonBody = {};
    }

    // Execute through Apollo Server's internal executeOperation
    const response = await server.executeOperation({
      query: jsonBody.query,
      variables: jsonBody.variables,
      operationName: jsonBody.operationName,
    });

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(response);
  };
} else {
  // Local development standalone server
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });
  console.log(`🚀 Local dev server ready at ${url}`);
}

export default handler || (async (req, res) => {
  res.status(404).send('Not in Vercel mode');
});