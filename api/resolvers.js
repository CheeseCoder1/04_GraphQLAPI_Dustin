import { pool } from '../db.js';

let categoryTransactionsCallCount = 0;

export const resolvers = {
  Query: {
    categories: async () => {
      // Reset the counter every time you run the main query
      categoryTransactionsCallCount = 0; 
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
      // 1. Increment the counter
      categoryTransactionsCallCount++;
      
      // 2. Output to the server terminal
      console.log(`[N+1 Problem] Resolver Category.transactions called for Category ID ${parent.id}! Total: ${categoryTransactionsCallCount}`);
      
      const result = await pool.query('SELECT * FROM transactions WHERE category_id = $1', [parent.id]);
      
      // 3. Inject the counter into the temporary field in the response
      return result.rows.map(row => ({
        ...row,
        resolverCallCount: categoryTransactionsCallCount
      }));
    }
  }
};