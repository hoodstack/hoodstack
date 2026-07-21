import { PRODUCT_LIST, getPublicModules } from "@hoodstack/config";
import type { MetadataRoute } from "next";

const BASE = "https://www.hoodstack.io";

/**
 * sitemap.xml.
 *
 * Public marketing + docs routes, derived from the module registry so it stays
 * in sync as products and modules change. The authenticated app is excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "/",
    "/products",
    "/token-utility",
    "/security",
    "/changelog",
    "/docs",
  ];

  const productHubs = PRODUCT_LIST.map((product) => product.href);
  const modulePages = getPublicModules()
    .map((module) => module.publicHref!)
    .filter((href) => href.startsWith("/products/"));

  const paths = [...new Set([...staticPaths, ...productHubs, ...modulePages])];
  const now = new Date();

  return paths.map((path) => ({
    url: `${BASE}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
