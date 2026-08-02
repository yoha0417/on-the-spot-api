import { drizzle } from 'drizzle-orm/d1';
import { D1Database } from '@cloudflare/d1';
import { schema } from './schema';

export function createDb(client: D1Database) {
  return drizzle(client, {
    schema,
    mode: 'default'
  });
}

// Export the database instance
export let db: ReturnType<typeof createDb>;