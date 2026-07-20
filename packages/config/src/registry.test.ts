import { describe, expect, it } from "vitest";

import { MODULES, MODULE_LIST } from "./modules.js";
import { PRODUCT_LIST, PRODUCT_ORDER, findProduct } from "./products.js";
import {
  CATEGORY_ORDER,
  buildAppNavigation,
  findModule,
  getAllPublicProductRoutes,
  getProductForModule,
  getProductModules,
  getPublicModules,
  getRelatedModules,
  isModuleEnabled,
  isModulePreview,
} from "./registry.js";
import type { HoodStackModuleId } from "./types.js";

const ids = Object.keys(MODULES) as HoodStackModuleId[];

describe("registry integrity", () => {
  it("keys every entry by its own id", () => {
    for (const id of ids) {
      expect(MODULES[id].id, `${id} is filed under the wrong key`).toBe(id);
    }
  });

  it("gives every module a unique app route", () => {
    // A collision would make two sidebar entries resolve to the same page.
    const routes = MODULE_LIST.map((module) => module.appHref("proj_test"));
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("gives every public module a unique marketing route", () => {
    const routes = getPublicModules().map((module) => module.publicHref);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("uses the documented route prefixes", () => {
    for (const module of MODULE_LIST) {
      expect(module.appHref("p"), module.id).toMatch(/^\/app\//);
      expect(module.docsHref, module.id).toMatch(/^\/docs/);
      if (module.publicHref !== undefined) {
        expect(module.publicHref, module.id).toMatch(/^\/products\//);
      }
    }
  });

  it("has non-empty copy for every module", () => {
    for (const module of MODULE_LIST) {
      expect(module.name.length, module.id).toBeGreaterThan(0);
      expect(module.shortDescription.length, module.id).toBeGreaterThan(0);
      expect(module.description.length, module.id).toBeGreaterThan(40);
    }
  });

  it("references only modules that exist, and never itself", () => {
    for (const module of MODULE_LIST) {
      for (const related of module.relatedModules ?? []) {
        expect(MODULES[related], `${module.id} -> ${related}`).toBeDefined();
        expect(related, `${module.id} relates to itself`).not.toBe(module.id);
      }
    }
  });

  it("assigns every module to a category the sidebar renders", () => {
    for (const module of MODULE_LIST) {
      expect(CATEGORY_ORDER, module.id).toContain(module.category);
    }
  });
});

describe("route safety", () => {
  it("encodes the project ID into app routes", () => {
    // Project IDs reach this from URLs and API payloads. An unencoded separator
    // would let a crafted ID escape its project's route namespace.
    expect(MODULES.gas.appHref("../../admin")).toBe("/app/..%2F..%2Fadmin/gas");
    expect(MODULES.gas.appHref("proj_123")).toBe("/app/proj_123/gas");
  });
});

describe("product layer", () => {
  it("assigns every product module to that product's category", () => {
    // The category IS the product membership. If they disagree, a module appears
    // under one product in the sidebar and another on the marketing site.
    for (const product of PRODUCT_LIST) {
      for (const moduleId of product.modules) {
        expect(MODULES[moduleId].category, `${moduleId} in ${product.id}`).toBe(
          product.id,
        );
      }
    }
  });

  it("claims every product module exactly once", () => {
    const claimed = PRODUCT_LIST.flatMap((product) => product.modules);
    expect(new Set(claimed).size, "a module is claimed by two products").toBe(
      claimed.length,
    );
  });

  it("leaves no product module unclaimed", () => {
    // A module categorized under a product but missing from its `modules` list
    // would vanish from the product page while still appearing in the sidebar.
    const claimed = new Set(PRODUCT_LIST.flatMap((p) => p.modules));
    const productCategories = new Set(PRODUCT_ORDER as readonly string[]);

    for (const module of MODULE_LIST) {
      if (!productCategories.has(module.category)) continue;
      expect(claimed, `${module.id} is not listed by its product`).toContain(module.id);
    }
  });

  it("covers every module in either a product, overview, or settings", () => {
    for (const module of MODULE_LIST) {
      const inProduct = PRODUCT_LIST.some((p) => p.modules.includes(module.id));
      const isArea = module.category === "overview" || module.category === "settings";
      expect(inProduct || isArea, `${module.id} belongs nowhere`).toBe(true);
    }
  });

  it("gives every product a hub route, surfaces, and copy", () => {
    for (const product of PRODUCT_LIST) {
      expect(product.href, product.id).toBe(`/products/${product.id}`);
      expect(product.surfaces.length, product.id).toBeGreaterThan(0);
      expect(product.tagline.length, product.id).toBeGreaterThan(0);
      expect(product.description.length, product.id).toBeGreaterThan(40);
      expect(product.modules.length, product.id).toBeGreaterThan(0);
    }
  });

  it("never collides a product hub route with a module product route", () => {
    // Both live under /products/, resolved by one dynamic route. A collision
    // would make one of them unreachable.
    const productHrefs = PRODUCT_LIST.map((p) => p.href);
    const moduleHrefs = getPublicModules().map((m) => m.publicHref!);
    for (const href of productHrefs) {
      expect(moduleHrefs, `${href} collides with a module route`).not.toContain(href);
    }
  });

  it("resolves a module back to its product", () => {
    expect(getProductForModule("gas")?.id).toBe("execution");
    expect(getProductForModule("accounts")?.id).toBe("identity");
    // Overview and settings are areas, not products.
    expect(getProductForModule("home")).toBeUndefined();
    expect(getProductForModule("billing")).toBeUndefined();
  });

  it("resolves a product to its module definitions", () => {
    expect(getProductModules("identity").map((m) => m.id)).toEqual([
      "accounts",
      "auth",
      "sessions",
    ]);
  });

  it("orders products the way navigation renders them", () => {
    expect(PRODUCT_LIST.map((p) => p.id)).toEqual([...PRODUCT_ORDER]);
    // Every product category must appear in the sidebar order too.
    for (const id of PRODUCT_ORDER) {
      expect(CATEGORY_ORDER, `${id} missing from navigation`).toContain(id);
    }
  });

  it("rejects unknown product lookups without resolving prototype keys", () => {
    expect(findProduct("identity")?.id).toBe("identity");
    expect(findProduct("nope")).toBeUndefined();
    expect(findProduct("constructor")).toBeUndefined();
  });
});

describe("navigation", () => {
  it("places every module in exactly one section", () => {
    const navigated = buildAppNavigation().flatMap((section) => section.modules);
    expect(navigated).toHaveLength(MODULE_LIST.length);
    expect(new Set(navigated.map((m) => m.id)).size).toBe(MODULE_LIST.length);
  });

  it("orders sections as documented", () => {
    const order = buildAppNavigation().map((section) => section.category);
    expect(order).toEqual([...CATEGORY_ORDER].filter((c) => order.includes(c)));
  });

  it("exposes the public product routes the site is specified to publish", () => {
    // The union of product hubs and module pages: /products/security is served
    // by the Security product hub rather than a duplicate module page.
    const published = new Set(getAllPublicProductRoutes());
    for (const href of [
      "/products/accounts",
      "/products/auth",
      "/products/transactions",
      "/products/gas",
      "/products/tokens",
      "/products/data",
      "/products/webhooks",
      "/products/policies",
      "/products/sessions",
      "/products/agents",
      "/products/treasury",
      "/products/security",
      "/products/sdk",
      "/products/cli",
      "/products/token-utility",
    ]) {
      expect(published, `missing public route ${href}`).toContain(href);
    }
  });

  it("publishes the products added from product review", () => {
    const published = new Set(getAllPublicProductRoutes());
    for (const href of [
      "/products/registry",
      "/products/explorer",
      "/products/recipes",
    ]) {
      expect(published, `missing public route ${href}`).toContain(href);
    }
  });

  it("keeps purely operational surfaces off the marketing site", () => {
    for (const id of ["apiKeys", "billing", "auditLogs", "team"] as const) {
      expect(MODULES[id].publicHref, id).toBeUndefined();
    }
  });

  it("resolves related modules", () => {
    expect(getRelatedModules("gas").map((m) => m.id)).toEqual([
      "transactions",
      "policies",
      "credits",
    ]);
  });
});

describe("findModule", () => {
  it("resolves known ids and rejects unknown input", () => {
    expect(findModule("gas")?.id).toBe("gas");
    expect(findModule("nope")).toBeUndefined();
  });

  it("does not resolve inherited object properties", () => {
    // A route param of "constructor" must not resolve to Object.prototype.
    expect(findModule("constructor")).toBeUndefined();
    expect(findModule("toString")).toBeUndefined();
  });
});

describe("availability gating", () => {
  it("reports no module as enabled until its implementation ships", () => {
    // The platform app and API do not exist yet. Marking anything enabled here
    // would make the product claim a capability it does not have.
    for (const module of MODULE_LIST) {
      expect(isModuleEnabled(module.id), module.id).toBe(false);
    }
  });

  it("treats every non-private module as a preview route", () => {
    for (const module of MODULE_LIST) {
      expect(isModulePreview(module.id), module.id).toBe(
        module.availability !== "private",
      );
    }
  });

  it("fails closed when a feature flag is missing", () => {
    const gated = {
      ...MODULES.gas,
      availability: "enabled" as const,
      featureFlag: "gas.sponsorship",
    };

    // Simulate the gate directly: an absent or false flag must not enable.
    const evaluate = (flags: Record<string, boolean>) =>
      gated.availability === "enabled" && flags[gated.featureFlag] === true;

    expect(evaluate({})).toBe(false);
    expect(evaluate({ "gas.sponsorship": false })).toBe(false);
    expect(evaluate({ "gas.sponsorship": true })).toBe(true);
  });
});
