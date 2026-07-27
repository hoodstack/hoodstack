import {
  bigserial,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * HoodStack relational schema.
 *
 * The identity boundary is deliberate: authentication lives in Privy, not here.
 * `users.privyDid` is the only link back to it, everything else (orgs, projects,
 * keys, usage) is HoodStack-owned and queried through Drizzle with authorization
 * enforced in server code, so the gateway and the dashboard share one data path.
 */

export const membershipRole = pgEnum("membership_role", ["owner", "admin", "member"]);

/** Which environment an API key acts against. Mirrors the `hs_live` / `hs_test` prefix. */
export const keyEnvironment = pgEnum("key_environment", ["live", "test"]);

/** Whether the recipient allowlist is enforced during evaluation. */
export const policyMode = pgEnum("policy_mode", ["off", "enforce"]);

/**
 * A person, mirrored from Privy on first authenticated request.
 *
 * We store the Privy DID (stable subject) rather than an email as the identity
 * key, because a user may sign in with a wallet or a social account and have no
 * email at all. Email, when present, is a convenience copy for display.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  privyDid: text("privy_did").notNull().unique(),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A billing and ownership boundary. Every project belongs to exactly one org. */
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Join table: which users belong to which org, and with what authority. */
export const memberships = pgTable(
  "memberships",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRole("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.orgId, t.userId] })],
);

/**
 * A project isolates API keys, environments, and usage. No project can read
 * another project's data, that boundary is enforced on every query by scoping
 * to the caller's org membership.
 */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("projects_org_slug_idx").on(t.orgId, t.slug)],
);

/**
 * An API key credential.
 *
 * The plaintext key is shown to the user exactly once, at creation, and never
 * stored. We keep only a SHA-256 hash for lookup, plus a display prefix and the
 * last four characters so the dashboard can show a recognisable, non-secret
 * fragment. Revocation is a timestamp, not a delete, so usage stays attributable.
 */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    environment: keyEnvironment("environment").notNull().default("test"),
    prefix: text("prefix").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    lastFour: text("last_four").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("api_keys_project_idx").on(t.projectId)],
);

/**
 * One recorded unit of metered work.
 *
 * Every authenticated gateway call writes a row here: which project and key,
 * which module and action, how many units, and the outcome. This is the raw
 * ledger the token-utility metering will aggregate over. `apiKeyId` is nullable
 * and set-null on delete so history survives key rotation.
 */
export const usageEvents = pgTable(
  "usage_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    apiKeyId: uuid("api_key_id").references(() => apiKeys.id, { onDelete: "set null" }),
    module: text("module").notNull(),
    action: text("action").notNull(),
    units: integer("units").notNull().default(1),
    status: text("status").notNull().default("ok"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("usage_events_project_created_idx").on(t.projectId, t.createdAt)],
);

/**
 * An address a project tracks: its own contracts, user wallets, treasury, or any
 * account it wants to monitor. HoodStack enriches each with live on-chain state
 * on demand. Unique per (project, address), so the same address is registered
 * once. This is the account registry; smart-account creation lands later.
 */
export const projectAccounts = pgTable(
  "project_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    address: text("address").notNull(),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("project_accounts_project_address_idx").on(t.projectId, t.address)],
);

/**
 * A project's execution policy: a spending ceiling and whether the recipient
 * allowlist is enforced. One row per project. These rules are evaluated during
 * transaction simulation today; enforcement at submit lands with signed
 * execution.
 */
export const projectPolicies = pgTable("project_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: "cascade" }),
  maxValueWei: text("max_value_wei"),
  allowlistMode: policyMode("allowlist_mode").notNull().default("off"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** An address a project's policy permits as a transaction recipient. */
export const policyAllowlist = pgTable(
  "policy_allowlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    address: text("address").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("policy_allowlist_project_address_idx").on(t.projectId, t.address)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type NewUsageEvent = typeof usageEvents.$inferInsert;
export type ProjectAccount = typeof projectAccounts.$inferSelect;
export type NewProjectAccount = typeof projectAccounts.$inferInsert;
export type ProjectPolicy = typeof projectPolicies.$inferSelect;
export type NewProjectPolicy = typeof projectPolicies.$inferInsert;
export type PolicyAllowlistEntry = typeof policyAllowlist.$inferSelect;
export type NewPolicyAllowlistEntry = typeof policyAllowlist.$inferInsert;
