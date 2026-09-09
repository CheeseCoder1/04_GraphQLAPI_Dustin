import { pool } from '../db.js';

export const resolvers = {
  Query: {
    categories: async () => {
      const result = await pool.query('SELECT * FROM categories');
      return result.rows;
    },
    transactions: async () => {
      const result = await pool.query('SELECT * FROM transactions');
      return result.rows;
    },
    transaction: async (_, { id }) => {
      const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
      return result.rows[0];
    }
  },
  Transaction: {
    category: async (parent) => {
      const result = await pool.query('SELECT * FROM categories WHERE id = $1', [parent.category_id]);
      return result.rows[0];
    }
  },
  Category: {
    transactions: async (parent) => {
      const result = await pool.query('SELECT * FROM transactions WHERE category_id = $1', [parent.id]);
      return result.rows;
    }
  }
};