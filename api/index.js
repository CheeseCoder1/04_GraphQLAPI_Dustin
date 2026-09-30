import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';

const app = express();

// 🚨 CRITICAL FIX: Explicitly configure CORS to allow the Authorization header
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apollo-require-preflight']
}));

app.use(express.json());

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
});

await server.start();

// 1. Root route to prevent Vercel 404
app.get('/', (req, res) => {
  res.send('API is running. Visit /graphql for the sandbox or /auth/login to authenticate.');
});

// 2. Redirect to Provider
app.get('/auth/login', (req, res) => {
  // Using the Vercel domain for the callback
  const redirectUri = 'https://04-graph-qlapi-dustin.vercel.app/auth/callback';
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}`;
  res.redirect(url);
});

// 3. Callback and Token Exchange
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;

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

  // Create your own JWT
  const token = jwt.sign({ username: githubUser.login }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token }); 
});

// 4. Protect Resolver Mutation by verifying the JWT
app.use(
  '/graphql',
  expressMiddleware(server, {
    context: async ({ req }) => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '');
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        return { user };
      } catch {
        return { user: null };
      }
    },
  })
);

if (!process.env.VERCEL) {
  app.listen(4000, () => {
    console.log(`🚀 Local dev server ready at http://localhost:4000/graphql`);
  });
}

// Export the app for Vercel Serverless Functions
export default app;