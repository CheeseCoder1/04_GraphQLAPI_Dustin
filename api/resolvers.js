import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Global counter for relation resolver executions
let relationCounter = 0;

export const resolvers = {
  Query: {
    categories: async () => {
      relationCounter = 0; // Reset counter for testing
      const { rows } = await pool.query('SELECT * FROM categories ORDER BY id ASC');
      return rows;
    },

    transactions: async () => {
      relationCounter = 0; // Reset counter for testing
      const { rows } = await pool.query('SELECT * FROM transactions ORDER BY id ASC');
      return rows;
    },

    transaction: async (_, { id }) => {
      const { rows } = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
      return rows[0] || null;
    },
  },

  Transaction: {
    createdAt: (parent) => {
      const date = parent.created_at || parent.createdAt;
      return date ? new Date(date).toISOString() : null;
    },

    category: async (parent) => {
      relationCounter += 1; // Increment for each relation call
      
      const categoryId = parent.category_id || parent.categoryId;
      if (!categoryId) return null;

      const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [categoryId]);
      const category = rows[0];
      
      // Inject the current counter value into the returned object
      if (category) {
        category.relationCallCount = relationCounter;
      }
      return category || null;
    },
  },

  Category: {
    transactions: async (parent) => {
      relationCounter += 1; // Increment for each relation call
      
      const { rows } = await pool.query(
        'SELECT * FROM transactions WHERE category_id = $1 ORDER BY id ASC',
        [parent.id]
      );
      
      // Inject the current counter value into every returned transaction object
      return rows.map(row => ({
        ...row,
        relationCallCount: relationCounter
      }));
    },
  },
};