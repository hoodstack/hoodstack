/**
 * Every module surface in the HoodStack platform.
 *
 * This union is the platform's vocabulary. Routes, navigation, documentation
 * links, and feature gating all derive from it, so an ID that ships here is a
 * public commitment: it appears in URLs developers bookmark and link to.
 * Adding an ID is cheap; renaming one breaks those URLs.
 */
export type HoodStackModuleId =
  // overview
  | "home"
  | "projects"
  | "activity"
  // identity
  | "accounts"
  | "auth"
  | "sessions"
  // execution
  | "transactions"
  | "gas"
  | "policies"
  // assets
  | "tokens"
  | "registry"
  // connectivity
  | "data"
  | "webhooks"
  | "explorer"
  | "apiKeys"
  | "environments"
  // automation
  | "agents"
  | "treasury"
  | "workflows"
  // security
  | "security"
  | "auditLogs"
  // developer
  | "sdk"
  | "cli"
  | "apiReference"
  | "playground"
  | "recipes"
  // network
  | "usage"
  | "credits"
  | "tokenUtility"
  // settings
  | "team"
  | "billing"
  | "projectSettings";

/**
 * A product.
 *
 * Products are what HoodStack sells and how developers think about it.
 * Packages are how it is built. Those are different things, and conflating
 * them produces navigation that reads like a build manifest.
 *
 * `overview` and `settings` are not products - they are places in the
 * application - but they group modules in navigation, so they share this union.
 */
export type HoodStackProductId =
  | "identity"
  | "execution"
  | "assets"
  | "connectivity"
  | "automation"
  | "security"
  | "developer"
  | "network";

/** Navigation groups: the eight products, plus two non-product areas. */
export type HoodStackModuleCategory = HoodStackProductId | "overview" | "settings";

/**
 * How a product is consumed.
 *
 * A product is not a package - it is delivered through several. Accounts, for
 * example, arrives as a server SDK, React hooks, a REST resource, and CLI
 * commands. Naming the surfaces makes the product concrete without exposing
 * the package layout.
 */
export type ProductSurface =
  "sdk" | "react" | "rest" | "cli" | "webhooks" | "dashboard" | "playground";

export interface ProductDefinition {
  readonly id: HoodStackProductId;
  readonly name: string;
  /** Three or four words. Used as the section subtitle. */
  readonly tagline: string;
  readonly description: string;
  /** Marketing hub route, e.g. `/products/identity`. */
  readonly href: string;
  /** Modules this product contains, in presentation order. */
  readonly modules: readonly HoodStackModuleId[];
  /** How developers consume it. */
  readonly surfaces: readonly ProductSurface[];
}

/**
 * Operational state of a module.
 *
 * Internal metadata that controls behavior - route rendering, API access,
 * whether controls are interactive. Deliberately *not* a marketing badge, and
 * must not be rendered as a status tag across the site.
 *
 * - `enabled` - implemented, tested, documented, and safe to use.
 * - `preview` - the interface is designed and the route explains it honestly,
 *   but the backing implementation is incomplete. Controls are disabled.
 * - `private` - access-gated; visible only to accounts that have been granted it.
 */
export type ModuleAvailability = "enabled" | "preview" | "private";

/**
 * Icon identifiers.
 *
 * A closed union rather than an arbitrary string so a typo surfaces at compile
 * time instead of rendering a blank space in the sidebar.
 */
export type HoodStackIconName =
  | "home"
  | "grid"
  | "pulse"
  | "wallet"
  | "key"
  | "clock"
  | "arrows"
  | "fuel"
  | "shield-check"
  | "coins"
  | "badge-check"
  | "database"
  | "webhook"
  | "search"
  | "api-key"
  | "layers"
  | "robot"
  | "vault"
  | "workflow"
  | "shield"
  | "scroll"
  | "package"
  | "terminal"
  | "book"
  | "play"
  | "recipe"
  | "chart"
  | "credit"
  | "token"
  | "users"
  | "card"
  | "settings";

export interface ModuleDefinition {
  readonly id: HoodStackModuleId;
  /** Display name. Used in navigation and page headings. */
  readonly name: string;
  /** One line, for sidebar tooltips and card subtitles. */
  readonly shortDescription: string;
  /** A paragraph describing the developer problem the module solves. */
  readonly description: string;
  readonly category: HoodStackModuleCategory;
  /**
   * Public marketing route.
   *
   * Optional: not every module has a marketing page. Purely operational
   * surfaces (API keys, billing, audit logs) exist only inside the app.
   */
  readonly publicHref?: string;
  /** Route within the authenticated app, scoped to a project. */
  readonly appHref: (projectId: string) => string;
  readonly docsHref: string;
  readonly icon: HoodStackIconName;
  readonly availability: ModuleAvailability;
  /** Runtime flag that can gate this module independently of availability. */
  readonly featureFlag?: string;
  readonly requiredPlan?: string;
  /** Modules a developer is likely to need alongside this one. */
  readonly relatedModules?: readonly HoodStackModuleId[];
}
