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
  await server.start();
  
  handler = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, apollo-require-preflight');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    
    let jsonBody = {};
    try {
      jsonBody = body ? JSON.parse(body) : {};
    } catch {
      jsonBody = {};
    }

    const response = await server.executeOperation({
      query: jsonBody.query,
      variables: jsonBody.variables,
      operationName: jsonBody.operationName,
    });

    res.setHeader('Content-Type', 'application/json');

    // Extract the GraphQL payload (data/errors) and status code
    const statusCode = response.http?.status || 200;
    const result = response.body.kind === 'single' 
      ? response.body.singleResult 
      : response.body;

    res.status(statusCode).json(result);
  };
} else {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });
  console.log(`🚀 Local dev server ready at ${url}`);
}

export default handler || (async (req, res) => {
  res.status(404).send('Not in Vercel mode');
});