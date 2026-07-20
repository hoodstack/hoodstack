/**
 * Security headers.
 *
 * The production CSP is strict: scripts are limited to same-origin files plus
 * the one hashed inline bootstrap. Styles get `'unsafe-inline'` because Next.js
 * injects inline style tags in the App Router with no nonce mechanism for them.
 *
 * `connect-src` is limited to Robinhood Chain endpoints plus self. A new
 * provider belongs here explicitly - a wildcard would defeat the CSP entirely.
 */
const isDev = process.env.NODE_ENV === "development";

const ROBINHOOD_ENDPOINTS = [
  "https://rpc.mainnet.chain.robinhood.com",
  "https://rpc.testnet.chain.robinhood.com",
  "https://sequencer.mainnet.chain.robinhood.com",
  "https://sequencer.testnet.chain.robinhood.com",
  "wss://feed.mainnet.chain.robinhood.com",
  "wss://feed.testnet.chain.robinhood.com",
].join(" ");

/**
 * SHA-256 of the inline theme bootstrap in `src/lib/theme.ts`.
 *
 * Keep in sync: if that script changes by even one byte, the theme will flash
 * on load because the browser will refuse to run it. `pnpm theme:hash` prints
 * the current value.
 */
const THEME_SCRIPT_HASH = "'sha256-rqkRcavrYl2kObMvX5rLUxbQwuaaNVDz0K3oq1YJEHs='";

/**
 * `script-src`, which necessarily differs between dev and production.
 *
 * `next dev` injects several inline scripts for hot-reloading and React refresh,
 * each with an unpredictable hash, and it uses `eval`. A hash-pinned policy
 * cannot cover them, so development blocks every one and the page never
 * hydrates.
 *
 * The CSP spec also makes a mixed policy impossible: once a hash or nonce is
 * present in `script-src`, the browser ignores `'unsafe-inline'`. So dev must
 * drop the hash entirely and rely on `'unsafe-inline' 'unsafe-eval'`.
 *
 * This relaxation applies to the dev server only. The production build - the one
 * that is ever deployed - keeps the strict, hash-pinned policy with no
 * `'unsafe-*'` for scripts.
 */
const scriptSrc = isDev
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
  : `script-src 'self' ${THEME_SCRIPT_HASH}`;

const csp = [
  `default-src 'self'`,
  scriptSrc,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob:`,
  `font-src 'self' data:`,
  // Dev needs a WebSocket back to the dev server for hot module reloading.
  `connect-src 'self' ${ROBINHOOD_ENDPOINTS}${isDev ? " ws: wss:" : ""}`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  // Rewriting http→https breaks localhost over plain http during development.
  ...(isDev ? [] : [`upgrade-insecure-requests`]),
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Pin the workspace root. Next.js otherwise walks up and can select an
  // unrelated lockfile outside the repository as the trace root.
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
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
