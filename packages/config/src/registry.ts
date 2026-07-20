import { MODULES, MODULE_LIST } from "./modules.js";
import { PRODUCTS } from "./products.js";
import type {
  HoodStackModuleCategory,
  HoodStackModuleId,
  HoodStackProductId,
  ModuleDefinition,
  ProductDefinition,
} from "./types.js";

/**
 * Navigation order.
 *
 * The eight products in the order a developer encounters them - identity before
 * execution, because you need an account before you can transact - bracketed by
 * the two non-product areas. This ordering is part of the product's mental model
 * and should not be shuffled casually.
 */
export const CATEGORY_ORDER: readonly HoodStackModuleCategory[] = [
  "overview",
  "identity",
  "execution",
  "assets",
  "connectivity",
  "automation",
  "security",
  "developer",
  "network",
  "settings",
];

export const CATEGORY_LABELS: Readonly<Record<HoodStackModuleCategory, string>> = {
  overview: "Overview",
  identity: "Identity",
  execution: "Execution",
  assets: "Assets",
  connectivity: "Connectivity",
  automation: "Automation",
  security: "Security",
  developer: "Developer",
  network: "Network",
  settings: "Settings",
};

export function getModule(id: HoodStackModuleId): ModuleDefinition {
  return MODULES[id];
}

/** Looks up a module by an untrusted string, e.g. a route parameter. */
export function findModule(id: string): ModuleDefinition | undefined {
  return Object.prototype.hasOwnProperty.call(MODULES, id)
    ? MODULES[id as HoodStackModuleId]
    : undefined;
}

export function getModulesByCategory(
  category: HoodStackModuleCategory,
): readonly ModuleDefinition[] {
  return MODULE_LIST.filter((module) => module.category === category);
}

export interface NavSection {
  readonly category: HoodStackModuleCategory;
  readonly label: string;
  readonly modules: readonly ModuleDefinition[];
}

/**
 * Builds the authenticated app sidebar.
 *
 * Every module appears regardless of availability. A module that is not yet
 * implemented keeps its place and its URL, and its route explains its status
 * honestly - removing it and adding it back later would break links and teach
 * developers that the navigation is unreliable.
 */
export function buildAppNavigation(): readonly NavSection[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    modules: getModulesByCategory(category),
  })).filter((section) => section.modules.length > 0);
}

/** Modules with a public marketing page, for site navigation and `/products`. */
export function getPublicModules(): readonly ModuleDefinition[] {
  return MODULE_LIST.filter((module) => module.publicHref !== undefined);
}

/**
 * Every route published under `/products/`.
 *
 * Both product hubs and module pages live there, resolved by one dynamic route.
 * Callers validating route coverage should use this rather than either list
 * alone - a product hub can be the marketing page for a module that shares its
 * name, in which case the module carries no `publicHref` of its own.
 */
export function getAllPublicProductRoutes(): readonly string[] {
  return [
    ...Object.values(PRODUCTS).map((product) => product.href),
    ...getPublicModules().map((module) => module.publicHref!),
  ];
}

export function getRelatedModules(id: HoodStackModuleId): readonly ModuleDefinition[] {
  return (MODULES[id].relatedModules ?? []).map((related) => MODULES[related]);
}

/** The modules a product contains, resolved to full definitions. */
export function getProductModules(id: HoodStackProductId): readonly ModuleDefinition[] {
  return PRODUCTS[id].modules.map((moduleId) => MODULES[moduleId]);
}

/** The product a module belongs to, or `undefined` for overview and settings. */
export function getProductForModule(
  id: HoodStackModuleId,
): ProductDefinition | undefined {
  const category = MODULES[id].category;
  return Object.prototype.hasOwnProperty.call(PRODUCTS, category)
    ? PRODUCTS[category as HoodStackProductId]
    : undefined;
}

/**
 * Whether a module's functionality may actually be used.
 *
 * Both conditions must hold: the module is marked `enabled` in the registry, and
 * its feature flag (if it declares one) is on. An unknown flag is treated as off
 * - a missing flag configuration must fail closed, not open.
 */
export function isModuleEnabled(
  id: HoodStackModuleId,
  flags: Readonly<Record<string, boolean>> = {},
): boolean {
  const module = MODULES[id];
  if (module.availability !== "enabled") return false;
  if (module.featureFlag === undefined) return true;
  return flags[module.featureFlag] === true;
}

/**
 * Whether a module's route should render its designed-but-inactive interface.
 *
 * Preview routes are genuinely useful - specification, architecture, intended
 * API - but every control on them is disabled and no API call behind them
 * returns a fabricated success.
 */
export function isModulePreview(
  id: HoodStackModuleId,
  flags: Readonly<Record<string, boolean>> = {},
): boolean {
  return !isModuleEnabled(id, flags) && MODULES[id].availability !== "private";
}
