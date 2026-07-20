/**
 * Static security headers.
 *
 * The Content-Security-Policy is NOT here — it needs a per-request nonce so the
 * App Router's streamed inline scripts are allowed, which a static header cannot
 * provide. It lives in `src/middleware.ts`. Everything below is request-agnostic
 * and safe to set statically.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Pin the workspace root. Next.js otherwise walks up and can select an
  // unrelated lockfile outside the repository as the trace root.
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname,

  async redirects() {
    return [
      // Token utility has one canonical home. Any older /products/token-utility
      // link (or app module link) resolves to it permanently.
      {
        source: "/products/token-utility",
        destination: "/token-utility",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Private tenant data must never be served from a shared cache.
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
      {
        source: "/app/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
