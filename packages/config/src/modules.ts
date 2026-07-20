import type { HoodStackModuleId, ModuleDefinition } from "./types.js";

/**
 * The HoodStack module registry.
 *
 * Single source of truth for site navigation, the app sidebar, routing,
 * documentation links, and feature gating.
 *
 * ## On `availability`
 *
 * Availability describes what is *implemented*, not what is planned. A module is
 * `enabled` only once its API routes, SDK methods, tests, and documentation have
 * shipped. Until then it is `preview`: the route exists and explains the module
 * honestly, but its controls are disabled and its API returns a clear
 * `HS_FEATURE_NOT_ENABLED` error rather than a mocked success.
 *
 * Modules are grouped into products by `category` - see `products.ts`. Products
 * are what developers evaluate and adopt; modules are the surfaces inside them.
 *
 * Every entry is currently `preview`. The platform application and API have not
 * been built yet. Any other value here would misrepresent the product.
 *
 * Flipping a module to `enabled` is a deliberate act with a checklist attached;
 * see `docs/operations/module-activation.md`.
 */

const app = (segment: string) => (projectId: string) =>
  `/app/${encodeURIComponent(projectId)}/${segment}`;

export const MODULES: Readonly<Record<HoodStackModuleId, ModuleDefinition>> = {
  // ---------------------------------------------------------------- overview

  home: {
    id: "home",
    name: "Home",
    shortDescription: "Project status at a glance.",
    description:
      "Entry point for a project: environment, recent activity, quickstart state, " +
      "and the configuration a project still needs before it can send its first " +
      "transaction.",
    category: "overview",
    appHref: app("overview"),
    docsHref: "/docs",
    icon: "home",
    availability: "preview",
  },

  projects: {
    id: "projects",
    name: "Projects",
    shortDescription: "Every project in the organization.",
    description:
      "Projects are the unit of isolation in HoodStack. Each has its own API keys, " +
      "environments, policies, and usage accounting, and no project can read " +
      "another's data.",
    category: "overview",
    appHref: () => "/app/projects",
    docsHref: "/docs/projects",
    icon: "grid",
    availability: "preview",
    relatedModules: ["environments", "apiKeys"],
  },

  activity: {
    id: "activity",
    name: "Activity",
    shortDescription: "Chronological record of what a project did.",
    description:
      "A merged timeline of account creation, transactions, user operations, " +
      "sponsorship decisions, and webhook deliveries - the first place to look when " +
      "something behaved unexpectedly.",
    category: "overview",
    appHref: app("activity"),
    docsHref: "/docs/activity",
    icon: "pulse",
    availability: "preview",
    relatedModules: ["transactions", "auditLogs"],
  },

  // ---------------------------------------------------------------- identity

  accounts: {
    id: "accounts",
    name: "Accounts",
    shortDescription: "Smart accounts for users, teams, and agents.",
    description:
      "ERC-4337 smart accounts on Robinhood Chain, created and addressed through a " +
      "provider adapter rather than a bespoke account implementation. Covers " +
      "creation, deterministic address prediction where the provider supports it, " +
      "lookup, and the user-operation lifecycle.",
    category: "identity",
    publicHref: "/products/accounts",
    appHref: app("accounts"),
    docsHref: "/docs/accounts",
    icon: "wallet",
    availability: "preview",
    relatedModules: ["auth", "transactions", "sessions"],
  },

  auth: {
    id: "auth",
    name: "Authentication",
    shortDescription: "Passkeys, email, and wallet sign-in.",
    description:
      "Identity separated from key ownership. One HoodStack identity can hold " +
      "several authentication methods, devices, and wallet accounts, so a user can " +
      "change how they sign in without changing which accounts they control.",
    category: "identity",
    publicHref: "/products/auth",
    appHref: app("auth"),
    docsHref: "/docs/auth",
    icon: "key",
    availability: "preview",
    relatedModules: ["accounts", "sessions", "security"],
  },

  transactions: {
    id: "transactions",
    name: "Transactions",
    shortDescription: "Build, simulate, submit, and track execution.",
    description:
      "Typed builders for transfers, approvals, contract calls, and batches, with " +
      "simulation and a readable summary before signing. A transaction is reported " +
      "confirmed only when a receipt satisfies the configured confirmation depth.",
    category: "execution",
    publicHref: "/products/transactions",
    appHref: app("transactions"),
    docsHref: "/docs/transactions",
    icon: "arrows",
    availability: "preview",
    relatedModules: ["accounts", "gas", "policies"],
  },

  gas: {
    id: "gas",
    name: "Gas",
    shortDescription: "Sponsorship policies, budgets, and abuse controls.",
    description:
      "Removes the requirement that a new user hold ETH before their first action. " +
      "Sponsorship runs behind a provider adapter and is bounded by per-user limits, " +
      "per-project budgets, contract and method allowlists, and a kill switch. Gas on " +
      "Robinhood Chain is paid in ETH.",
    category: "execution",
    publicHref: "/products/gas",
    appHref: app("gas"),
    docsHref: "/docs/gas",
    icon: "fuel",
    availability: "preview",
    relatedModules: ["transactions", "policies", "credits"],
  },

  tokens: {
    id: "tokens",
    name: "Tokens",
    shortDescription: "Balances, transfers, and a canonical asset registry.",
    description:
      "ERC-20 reads and builders plus a canonical asset registry that records the " +
      "source and verification date for every entry. Assets are identified by chain " +
      "ID and contract address; a ticker alone is never sufficient, because symbols " +
      "are not unique and are trivially spoofed.",
    category: "assets",
    publicHref: "/products/tokens",
    appHref: app("tokens"),
    docsHref: "/docs/tokens",
    icon: "coins",
    availability: "preview",
    relatedModules: ["transactions", "data"],
  },

  sessions: {
    id: "sessions",
    name: "Sessions",
    shortDescription: "Scoped, expiring execution permissions.",
    description:
      "Session keys let an application act within limits a user has granted - " +
      "specific contracts, specific methods, a value ceiling, an expiry - without " +
      "prompting for every action and without holding the user's primary key.",
    category: "identity",
    publicHref: "/products/sessions",
    appHref: app("sessions"),
    docsHref: "/docs/sessions",
    icon: "clock",
    availability: "preview",
    relatedModules: ["accounts", "policies", "agents"],
  },

  policies: {
    id: "policies",
    name: "Policies",
    shortDescription: "Spending limits and allowlists enforced before signing.",
    description:
      "Declarative rules covering spend limits, contract and recipient allowlists, " +
      "and rate limits. Policies are evaluated server-side before a payload is " +
      "signed, so a compromised client cannot bypass them.",
    category: "execution",
    publicHref: "/products/policies",
    appHref: app("policies"),
    docsHref: "/docs/policies",
    icon: "shield-check",
    availability: "preview",
    relatedModules: ["security", "gas", "sessions"],
  },

  registry: {
    id: "registry",
    name: "Asset Registry",
    shortDescription: "Verified contracts, assets, and metadata.",
    description:
      "A canonical record of what a contract on Robinhood Chain actually is. Every " +
      "entry carries its source, verification method, and last-verified date, so a " +
      "consumer can judge how much to trust it. Symbols are attacker-controlled and " +
      "trivially spoofed, so nothing is identified by ticker - entries are keyed by " +
      "chain ID and contract address.",
    category: "assets",
    publicHref: "/products/registry",
    appHref: app("registry"),
    docsHref: "/docs/registry",
    icon: "badge-check",
    availability: "preview",
    relatedModules: ["tokens", "security", "explorer"],
  },

  // ------------------------------------------------------------ connectivity

  data: {
    id: "data",
    name: "Data",
    shortDescription: "Balances, history, and indexed account activity.",
    description:
      "Read APIs for balances, transaction history, receipts, blocks, and logs, " +
      "served through an indexed-data adapter with raw RPC fallback for the reads " +
      "that support it.",
    category: "connectivity",
    publicHref: "/products/data",
    appHref: app("data"),
    docsHref: "/docs/data",
    icon: "database",
    availability: "preview",
    relatedModules: ["tokens", "webhooks"],
  },

  webhooks: {
    id: "webhooks",
    name: "Webhooks",
    shortDescription: "Signed, retried delivery of platform events.",
    description:
      "Signed and timestamped payloads with replay protection, exponential backoff, " +
      "a full delivery log, dead-letter handling, manual redelivery, and secret " +
      "rotation - so an endpoint outage does not silently lose events.",
    category: "connectivity",
    publicHref: "/products/webhooks",
    appHref: app("webhooks"),
    docsHref: "/docs/webhooks",
    icon: "webhook",
    availability: "preview",
    relatedModules: ["data", "transactions"],
  },

  explorer: {
    id: "explorer",
    name: "Explorer",
    shortDescription: "Accounts, transactions, and contracts in context.",
    description:
      "A developer-oriented view of chain state that understands what HoodStack " +
      "builds: smart accounts and their owners, user operations alongside the " +
      "transactions that carried them, sponsorship decisions and why they were made. " +
      "Complements Blockscout rather than replacing it - canonical block and " +
      "transaction links continue to point there.",
    category: "connectivity",
    publicHref: "/products/explorer",
    appHref: app("explorer"),
    docsHref: "/docs/explorer",
    icon: "search",
    availability: "preview",
    relatedModules: ["data", "transactions", "registry"],
  },

  apiKeys: {
    id: "apiKeys",
    name: "API Keys",
    shortDescription: "Scoped credentials per project and environment.",
    description:
      "Keys are stored hashed and shown in full exactly once, at creation. They " +
      "carry an identifiable prefix so a leaked key can be recognized and revoked " +
      "quickly, and they are scoped to a single project and environment.",
    category: "connectivity",
    appHref: app("api-keys"),
    docsHref: "/docs/api-keys",
    icon: "api-key",
    availability: "preview",
    relatedModules: ["environments", "security"],
  },

  environments: {
    id: "environments",
    name: "Environments",
    shortDescription: "Separate testnet and mainnet configuration.",
    description:
      "Each environment carries its own keys, policies, allowed origins, and network " +
      "target. Testnet is the default; mainnet writes require an explicit, confirmed " +
      "opt-in.",
    category: "connectivity",
    appHref: app("environments"),
    docsHref: "/docs/environments",
    icon: "layers",
    availability: "preview",
    relatedModules: ["apiKeys", "projects"],
  },

  // -------------------------------------------------------------- automation

  agents: {
    id: "agents",
    name: "Agents",
    shortDescription: "Programmable accounts for autonomous software.",
    description:
      "Accounts operated by software rather than a person, constrained by explicit " +
      "budgets, allowlists, and expiry. Permissions are cryptographic; economic " +
      "collateral is never a substitute for them.",
    category: "automation",
    publicHref: "/products/agents",
    appHref: app("agents"),
    docsHref: "/docs/agents",
    icon: "robot",
    availability: "preview",
    relatedModules: ["sessions", "policies", "workflows"],
  },

  treasury: {
    id: "treasury",
    name: "Treasury",
    shortDescription: "Programmatic movement of project-owned funds.",
    description:
      "Rules for sweeps, disbursement, and rebalancing across project-controlled " +
      "accounts, subject to the same policy engine and audit trail as user-initiated " +
      "transactions.",
    category: "automation",
    publicHref: "/products/treasury",
    appHref: app("treasury"),
    docsHref: "/docs/treasury",
    icon: "vault",
    availability: "preview",
    relatedModules: ["policies", "transactions", "auditLogs"],
  },

  workflows: {
    id: "workflows",
    name: "Workflows",
    shortDescription: "Scheduled and event-triggered execution.",
    description:
      "Multi-step execution driven by a schedule or an onchain event, with " +
      "idempotency and explicit failure handling so a retry cannot duplicate a " +
      "payment.",
    category: "automation",
    appHref: app("workflows"),
    docsHref: "/docs/workflows",
    icon: "workflow",
    availability: "preview",
    relatedModules: ["agents", "webhooks", "treasury"],
  },

  // ---------------------------------------------------------------- security

  security: {
    id: "security",
    name: "Security",
    shortDescription: "Risk checks, allowlists, and emergency controls.",
    description:
      "Pre-signature transaction risk checks, contract and recipient allowlists, " +
      "security event surfacing, and a project-level kill switch that stops " +
      "execution immediately.",
    category: "security",
    // No module-level marketing route: this module shares its name with its
    // product, and /products/security is the product hub. A duplicate page
    // would compete with it for the same URL and the same search intent.
    appHref: app("security"),
    docsHref: "/docs/security",
    icon: "shield",
    availability: "preview",
    relatedModules: ["policies", "auditLogs", "auth"],
  },

  auditLogs: {
    id: "auditLogs",
    name: "Audit Logs",
    shortDescription: "Append-only record of privileged actions.",
    description:
      "Who did what, when, from where, across key creation, policy changes, " +
      "environment configuration, and access grants. Append-only, so the record of " +
      "an incident cannot be edited after it.",
    category: "security",
    appHref: app("audit-logs"),
    docsHref: "/docs/audit-logs",
    icon: "scroll",
    availability: "preview",
    relatedModules: ["security", "team"],
  },

  // --------------------------------------------------------------- developer

  sdk: {
    id: "sdk",
    name: "SDKs",
    shortDescription: "TypeScript, React, and server libraries.",
    description:
      "A browser SDK limited to browser-safe operations, a server SDK for " +
      "privileged project APIs, and React hooks with optional components. The " +
      "browser/server split is enforced by package boundaries so a server secret " +
      "cannot reach a client bundle by accident.",
    category: "developer",
    publicHref: "/products/sdk",
    appHref: app("sdks"),
    docsHref: "/docs/sdk",
    icon: "package",
    availability: "preview",
    relatedModules: ["cli", "apiReference"],
  },

  cli: {
    id: "cli",
    name: "CLI",
    shortDescription: "Project setup, keys, and diagnostics from a terminal.",
    description:
      "Scaffolding, project and key management, environment validation, and network " +
      "diagnostics, with a JSON output mode and proper exit codes for CI. Secrets are " +
      "redacted and never redisplayed after creation.",
    category: "developer",
    publicHref: "/products/cli",
    appHref: app("cli"),
    docsHref: "/docs/cli",
    icon: "terminal",
    availability: "preview",
    relatedModules: ["sdk", "environments"],
  },

  apiReference: {
    id: "apiReference",
    name: "API Reference",
    shortDescription: "Versioned REST API and OpenAPI specification.",
    description:
      "The versioned HTTP API behind every SDK, described by an OpenAPI document, " +
      "with idempotency keys, cursor pagination, stable error codes, and request IDs.",
    category: "developer",
    appHref: app("api-reference"),
    docsHref: "/docs/api",
    icon: "book",
    availability: "preview",
    relatedModules: ["sdk"],
  },

  playground: {
    id: "playground",
    name: "Playground",
    shortDescription: "Run API calls against testnet from the dashboard.",
    description:
      "An interactive console for issuing API calls against a project's testnet " +
      "environment and inspecting the exact request and response, without writing " +
      "throwaway code.",
    category: "developer",
    appHref: app("playground"),
    docsHref: "/docs/playground",
    icon: "play",
    availability: "preview",
    relatedModules: ["apiReference", "sdk"],
  },

  recipes: {
    id: "recipes",
    name: "Recipes",
    shortDescription: "Complete, working solutions to common workflows.",
    description:
      "Copy-paste implementations of the things applications actually build: a " +
      "Next.js starter, gasless checkout, a treasury wallet, RWA minting, stock-token " +
      "transfer, recurring payments, session keys. Every recipe is a runnable " +
      "application, tested in CI, defaulting to testnet - not a fragment that omits " +
      "the error handling.",
    category: "developer",
    publicHref: "/products/recipes",
    appHref: app("recipes"),
    docsHref: "/docs/recipes",
    icon: "recipe",
    availability: "preview",
    relatedModules: ["sdk", "playground", "cli"],
  },

  // ----------------------------------------------------------------- network

  usage: {
    id: "usage",
    name: "Usage",
    shortDescription: "Metered consumption per project and environment.",
    description:
      "Measured service consumption - API requests, sponsored gas, webhook " +
      "deliveries, account operations - reported from recorded events rather than " +
      "estimates.",
    category: "network",
    appHref: app("usage"),
    docsHref: "/docs/usage",
    icon: "chart",
    availability: "preview",
    relatedModules: ["credits", "gas"],
  },

  credits: {
    id: "credits",
    name: "Credits",
    shortDescription: "Non-transferable ledger for service capacity.",
    description:
      "Usage credits are an append-only, offchain ledger tied to actual service " +
      "consumption. They are non-transferable and non-tokenized, and they work " +
      "without any token involvement.",
    category: "network",
    appHref: app("credits"),
    docsHref: "/docs/credits",
    icon: "credit",
    availability: "preview",
    relatedModules: ["usage", "tokenUtility"],
  },

  tokenUtility: {
    id: "tokenUtility",
    name: "Token Utility",
    shortDescription: "How a future token would coordinate capacity.",
    description:
      "Architecture for translating verified stake, token-funded credits, and " +
      "operator bonds into service capacity. No token has been launched, no contract " +
      "has been deployed, and the platform is fully usable without one. Nothing here " +
      "is required to create an account, sign in, recover access, or withdraw funds.",
    category: "network",
    // Single canonical route for token utility — top-level, not under /products.
    // /products/token-utility 308-redirects here (see next.config.mjs).
    publicHref: "/token-utility",
    appHref: app("token-utility"),
    docsHref: "/docs/token-utility",
    icon: "token",
    availability: "preview",
    relatedModules: ["credits", "usage"],
  },

  // ---------------------------------------------------------------- settings

  team: {
    id: "team",
    name: "Team",
    shortDescription: "Organization members and their access.",
    description: "Membership, roles, and per-project access within an organization.",
    category: "settings",
    appHref: app("team"),
    docsHref: "/docs/team",
    icon: "users",
    availability: "preview",
    relatedModules: ["auditLogs"],
  },

  billing: {
    id: "billing",
    name: "Billing",
    shortDescription: "Plan, invoices, and payment method.",
    description:
      "Subscription and invoicing. Paying with conventional payment methods is " +
      "always supported and is never gated behind a token.",
    category: "settings",
    appHref: app("billing"),
    docsHref: "/docs/billing",
    icon: "card",
    availability: "preview",
    relatedModules: ["credits", "usage"],
  },

  projectSettings: {
    id: "projectSettings",
    name: "Project Settings",
    shortDescription: "Name, origins, network target, and deletion.",
    description:
      "Project-level configuration including allowed origins, network target, the " +
      "mainnet-write opt-in, and deletion with confirmation safeguards.",
    category: "settings",
    appHref: app("settings"),
    docsHref: "/docs/project-settings",
    icon: "settings",
    availability: "preview",
    relatedModules: ["environments", "security"],
  },
};

export const MODULE_LIST: readonly ModuleDefinition[] = Object.values(MODULES);
