import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "./schema";

export function createDb(client: D1Database) {
	return drizzle(client, {
		schema,
	});
}

export type DbInstance = ReturnType<typeof createDb>;

// Export the database instance
export let db: DbInstance;
