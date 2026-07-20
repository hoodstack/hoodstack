import { NextResponse, type NextRequest } from "next/server";

/**
 * Content-Security-Policy, per request.
 *
 * The App Router streams pages via dynamically-generated inline scripts, which
 * cannot be covered by a static hash. A hash-only `script-src` therefore blocks
 * hydration in the browser and the page renders blank after its first paint —
 * exactly the failure this replaces.
 *
 * The fix is a per-request nonce. Middleware generates one, puts the CSP (with
 * the nonce) on the request headers, and Next.js reads it and stamps the nonce
 * onto every script it emits. `'strict-dynamic'` lets those trusted scripts load
 * the chunk files, so `'self'`/host allowlisting is not relied on in modern
 * browsers. The one inline script we author ourselves — the theme bootstrap in
 * layout.tsx — is allowed by its hash, which is honoured even under
 * `'strict-dynamic'`.
 *
 * Using a nonce forces dynamic rendering. That is an accepted trade for a
 * correct, strict CSP on this app.
 */

const ROBINHOOD_ENDPOINTS = [
  "https://rpc.mainnet.chain.robinhood.com",
  "https://rpc.testnet.chain.robinhood.com",
  "https://sequencer.mainnet.chain.robinhood.com",
  "https://sequencer.testnet.chain.robinhood.com",
  "wss://feed.mainnet.chain.robinhood.com",
  "wss://feed.testnet.chain.robinhood.com",
].join(" ");

// SHA-256 of the inline theme bootstrap in src/lib/theme.ts (pnpm theme:hash).
const THEME_SCRIPT_HASH = "'sha256-rqkRcavrYl2kObMvX5rLUxbQwuaaNVDz0K3oq1YJEHs='";

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const nonce = btoa(crypto.randomUUID());

  // Development: the Next dev server uses inline scripts and eval for HMR that a
  // nonce/strict-dynamic policy would block, so dev stays permissive for scripts.
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${THEME_SCRIPT_HASH}`;

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${ROBINHOOD_ENDPOINTS}${isDev ? " ws: wss:" : ""}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next reads the nonce from this request header and applies it to its scripts.
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Run on documents; skip static assets, the image optimizer, and icons —
    // they are not HTML and do not carry inline scripts.
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)",
    },
  ],
};
