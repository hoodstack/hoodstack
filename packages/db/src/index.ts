export * from "./schema.js";
export { getDb, type Database } from "./client.js";

// Re-export the Drizzle query helpers callers need so consumers don't have to
// add drizzle-orm as a direct dependency just to write `eq(...)`.
export {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
