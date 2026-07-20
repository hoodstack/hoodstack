import type { HoodStackProductId, ProductDefinition } from "./types.js";

/**
 * The HoodStack product catalog.
 *
 * Products are the unit developers evaluate, adopt, and talk about. Packages
 * are the unit we ship. A product is delivered through several packages, and a
 * package can serve several products, so the two are separate layers on
 * purpose - see ADR 0007.
 *
 * Presentation order matters: it is the order of the homepage and the sidebar,
 * and it follows the order a developer encounters these concerns. Identity
 * before execution, because you need an account before you can transact.
 */
export const PRODUCTS: Readonly<Record<HoodStackProductId, ProductDefinition>> = {
  identity: {
    id: "identity",
    name: "Identity",
    tagline: "Who is acting",
    description:
      "Accounts, authentication, and scoped sessions. Identity is kept separate " +
      "from key ownership, so a user can change how they sign in without changing " +
      "what they control.",
    href: "/products/identity",
    modules: ["accounts", "auth", "sessions"],
    surfaces: ["sdk", "react", "rest", "cli", "dashboard"],
  },

  execution: {
    id: "execution",
    name: "Execution",
    tagline: "What happens on chain",
    description:
      "Building, simulating, sponsoring, and submitting transactions. Every " +
      "limit that matters is evaluated server-side before anything is signed.",
    href: "/products/execution",
    modules: ["transactions", "gas", "policies"],
    surfaces: ["sdk", "react", "rest", "webhooks", "dashboard"],
  },

  assets: {
    id: "assets",
    name: "Assets",
    tagline: "What is being moved",
    description:
      "Token reads, transfers, and a canonical registry that records the source " +
      "and verification date of every entry. Assets are identified by chain ID " +
      "and contract address - never by ticker.",
    href: "/products/assets",
    modules: ["tokens", "registry"],
    surfaces: ["sdk", "react", "rest", "dashboard"],
  },

  connectivity: {
    id: "connectivity",
    name: "Connectivity",
    tagline: "Reading the chain",
    description:
      "Balances, history, indexed activity, and signed event delivery - plus the " +
      "keys and environments that scope access to them.",
    href: "/products/connectivity",
    modules: ["data", "webhooks", "explorer", "apiKeys", "environments"],
    surfaces: ["sdk", "rest", "webhooks", "cli", "dashboard"],
  },

  automation: {
    id: "automation",
    name: "Automation",
    tagline: "Acting without a human",
    description:
      "Agent accounts, treasury movement, and scheduled or event-driven " +
      "workflows, all bounded by explicit budgets, allowlists, and expiry.",
    href: "/products/automation",
    modules: ["agents", "treasury", "workflows"],
    surfaces: ["sdk", "rest", "webhooks", "dashboard"],
  },

  security: {
    id: "security",
    name: "Security",
    tagline: "What is not allowed",
    description:
      "Risk checks before signing, allowlists, an append-only audit trail, and a " +
      "kill switch that stops execution immediately.",
    href: "/products/security",
    modules: ["security", "auditLogs"],
    surfaces: ["rest", "webhooks", "dashboard"],
  },

  developer: {
    id: "developer",
    name: "Developer platform",
    tagline: "How you build",
    description:
      "SDKs, a CLI, a versioned REST API, an in-browser playground, and " +
      "copy-paste recipes for the workflows most applications actually need.",
    href: "/products/developer",
    modules: ["sdk", "cli", "apiReference", "playground", "recipes"],
    surfaces: ["sdk", "react", "rest", "cli", "playground"],
  },

  network: {
    id: "network",
    name: "Network",
    tagline: "What it costs",
    description:
      "Metered usage and a non-transferable credit ledger that determines service " +
      "capacity. A future token becomes an additional way to fund credits - never " +
      "a requirement to use the platform.",
    href: "/products/network",
    modules: ["usage", "credits", "tokenUtility"],
    surfaces: ["rest", "dashboard"],
  },
};

export const PRODUCT_ORDER: readonly HoodStackProductId[] = [
  "identity",
  "execution",
  "assets",
  "connectivity",
  "automation",
  "security",
  "developer",
  "network",
];

export const PRODUCT_LIST: readonly ProductDefinition[] = PRODUCT_ORDER.map(
  (id) => PRODUCTS[id],
);

export const SURFACE_LABELS: Readonly<Record<string, string>> = {
  sdk: "Server SDK",
  react: "React",
  rest: "REST API",
  cli: "CLI",
  webhooks: "Webhooks",
  dashboard: "Dashboard",
  playground: "Playground",
};

export function getProduct(id: HoodStackProductId): ProductDefinition {
  return PRODUCTS[id];
}

/** Looks up a product by an untrusted string, e.g. a route parameter. */
export function findProduct(id: string): ProductDefinition | undefined {
  return Object.prototype.hasOwnProperty.call(PRODUCTS, id)
    ? PRODUCTS[id as HoodStackProductId]
    : undefined;
}
