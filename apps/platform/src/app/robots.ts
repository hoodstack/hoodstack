import type { MetadataRoute } from "next";

const BASE = "https://www.hoodstack.io";

/**
 * robots.txt.
 *
 * Marketing and docs are indexable. The authenticated app is not — it is
 * per-tenant, uncacheable, and behind auth, so it is disallowed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/app/", "/api/"] },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
