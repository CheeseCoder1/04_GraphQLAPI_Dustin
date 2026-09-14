import pg from 'pg';
const { Pool } = pg;

// Database connection using the environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Counter variable to track resolver execution count across queries
let callCount = 0;

export const resolvers = {
  Query: {
    // Fetch all categories
    categories: async () => {
      const { rows } = await pool.query('SELECT * FROM categories ORDER BY id ASC');
      return rows;
    },

    // Fetch all transactions
    transactions: async () => {
      const { rows } = await pool.query('SELECT * FROM transactions ORDER BY id ASC');
      return rows;
    },

    // Fetch a single transaction by ID
    transaction: async (_, { id }) => {
      const { rows } = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
      return rows[0] || null;
    },
  },

  Transaction: {
    // Increments and returns the count every time an individual transaction is resolved
    resolverCallCount: () => {
      callCount += 1;
      return callCount;
    },

    // Format timestamps to match GraphQL String if stored as DATE/TIMESTAMP in PostgreSQL
    createdAt: (parent) => {
      const date = parent.created_at || parent.createdAt;
      return date ? new Date(date).toISOString() : null;
    },

    // Resolve the category relationship for each transaction (handles category_id or categoryId)
    category: async (parent) => {
      const categoryId = parent.category_id || parent.categoryId;
      if (!categoryId) return null;

      const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [categoryId]);
      return rows[0] || null;
    },
  },

  Category: {
    // Resolve all transactions associated with this specific category
    transactions: async (parent) => {
      const { rows } = await pool.query(
        'SELECT * FROM transactions WHERE category_id = $1 ORDER BY id ASC',
        [parent.id]
      );
      return rows;
    },
  },
};