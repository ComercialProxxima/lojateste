import { Pool } from 'pg'; // PostgreSQL nativo
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';
 
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to provision a database?',
  );
}
 
const { Pool } = import('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // necessário para conexões SSL em serviços externos
  },
});
 
export const db = drizzle(pool, { schema });
