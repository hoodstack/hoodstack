import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";

/**
 * A ready-to-query Drizzle database bound to the HoodStack schema.
 */
export type Database = ReturnType<typeof drizzle<typeof schema>>;

// Cache the client on globalThis so Next's dev hot-reload and serverless module
// reuse don't open a new connection pool on every invocation, which would
// exhaust Supabase's connection limit. One pool per process is the goal.
const globalForDb = globalThis as unknown as {
  __hoodstackDb?: Database;
  __hoodstackSql?: ReturnType<typeof postgres>;
};

/**
 * Get the shared database client.
 *
 * `connectionString` defaults to `DATABASE_URL`, which in production should be
 * Supabase's *pooled* connection (transaction mode, port 6543). `prepare: false`
 * is required for that pooler, PgBouncer in transaction mode cannot support
 * prepared statements, and Drizzle/postgres-js would otherwise use them.
 */
export function getDb(connectionString: string | undefined = process.env.DATABASE_URL): Database {
  if (globalForDb.__hoodstackDb) return globalForDb.__hoodstackDb;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Point it at the Supabase pooled connection string (port 6543).",
    );
  }

  const sql = postgres(connectionString, { prepare: false });
  const db = drizzle(sql, { schema });

  globalForDb.__hoodstackSql = sql;
  globalForDb.__hoodstackDb = db;
  return db;
}
