import { defineConfig } from "drizzle-kit";

/**
 * Migrations run against the *direct* connection (port 5432), not the pooler:
 * DDL and prepared statements are unreliable through PgBouncer's transaction
 * pooling. `DIRECT_URL` is the direct string; it falls back to `DATABASE_URL`
 * for local setups that use one connection for both.
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
