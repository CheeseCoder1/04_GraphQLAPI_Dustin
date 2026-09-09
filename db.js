import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_rjL3l5JYwhMe@ep-bitter-glitter-aztcv1s6-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});