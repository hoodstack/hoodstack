import { resolve } from "node:path";

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load credentials from the platform app's env files, so there is one source of
// truth for secrets rather than a second copy under packages/db. drizzle-kit
// runs with this package as the cwd, so the app lives two levels up. dotenv does
// not overwrite variables already present in the environment.
for (const file of [".env.local", ".env"]) {
  config({ path: resolve(process.cwd(), "..", "..", "apps", "platform", file) });
}

/**
 * Migrations run against the direct (unpooled) connection, not the pooler: DDL
 * and prepared statements are unreliable through a transaction pooler. On Neon
 * that is the connection string without `-pooler` in the host; on Supabase it is
 * port 5432. `DIRECT_URL` is that string; it falls back to `DATABASE_URL` for
 * setups that use one connection for both.
 */
export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
