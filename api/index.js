import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import jwt from 'jsonwebtoken';
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
    // 🚨 CRITICAL FIX: Added 'authorization' to the allowed headers list
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, apollo-require-preflight, authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    const url = new URL(req.url, `https://${req.headers.host}`);

    // --- 1. LAB 07: LOGIN ROUTE ---
    if (url.pathname === '/auth/login') {
      const redirectUri = 'https://04-graph-qlapi-dustin.vercel.app/auth/callback';
      res.writeHead(302, { 
        Location: `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}` 
      });
      return res.end();
    }

    // --- 2. LAB 07: CALLBACK ROUTE ---
    if (url.pathname === '/auth/callback') {
      const code = url.searchParams.get('code');
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code
        })
      });
      const { access_token } = await tokenRes.json();

      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const githubUser = await userRes.json();
      
      const token = jwt.sign({ username: githubUser.login }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ token });
    }

    // --- 3. GRAPHQL ROUTE ---
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

    // Verify JWT Token for Context
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    let user = null;
    
    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        user = null;
      }
    }

    const response = await server.executeOperation({
      query: jsonBody.query,
      variables: jsonBody.variables,
      operationName: jsonBody.operationName,
    }, {
      contextValue: { user }
    });

    res.setHeader('Content-Type', 'application/json');
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