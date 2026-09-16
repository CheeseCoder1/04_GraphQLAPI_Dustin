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
      relationCounter = 0; 
      const { rows } = await pool.query('SELECT * FROM categories ORDER BY id ASC');
      return rows;
    },

    transactions: async () => {
      relationCounter = 0; 
      const { rows } = await pool.query('SELECT * FROM transactions ORDER BY id ASC');
      return rows;
    },

    transaction: async (_, { id }) => {
      const { rows } = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
      return rows[0] || null;
    },
  },

  // === TAMBAHKAN BLOK MUTATION INI ===
  Mutation: {
    createTransaction: async (_, { input }) => {
      // Destructure the values directly from the input object
      const { amount, type, description, categoryId } = input;
      
      const { rows } = await pool.query(
        `INSERT INTO transactions (amount, type, description, category_id) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [amount, type, description, categoryId]
      );
      return rows[0];
    },

    updateTransaction: async (_, { id, input }) => {
      const { amount, type, description, categoryId } = input;
      
      const { rows } = await pool.query(
        `UPDATE transactions 
         SET amount = COALESCE($1, amount), 
             type = COALESCE($2, type), 
             description = COALESCE($3, description), 
             category_id = COALESCE($4, category_id)
         WHERE id = $5 
         RETURNING *`,
        [amount, type, description, categoryId, id]
      );
      return rows[0] || null;
    },

    deleteTransaction: async (_, { id }) => {
      const { rowCount } = await pool.query(
        'DELETE FROM transactions WHERE id = $1',
        [id]
      );
      return rowCount > 0;
    }
  },
  // ===================================

  Transaction: {
    createdAt: (parent) => {
      const date = parent.created_at || parent.createdAt;
      return date ? new Date(date).toISOString() : null;
    },

    category: async (parent) => {
      relationCounter += 1; 
      const currentCount = relationCounter; 
      
      const categoryId = parent.category_id || parent.categoryId;
      if (!categoryId) return null;

      const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [categoryId]);
      const category = rows[0];
      
      if (category) {
        category.relationCallCount = currentCount;
      }
      return category || null;
    },
  },

  Category: {
    transactions: async (parent) => {
      relationCounter += 1; 
      
      const { rows } = await pool.query(
        'SELECT * FROM transactions WHERE category_id = $1 ORDER BY id ASC',
        [parent.id]
      );
      
      return rows.map(row => ({
        ...row,
        relationCallCount: relationCounter
      }));
    },
  },
};