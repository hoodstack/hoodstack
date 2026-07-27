import { NextResponse, type NextRequest } from "next/server";

/**
 * Content-Security-Policy, per request.
 *
 * The App Router streams pages via dynamically-generated inline scripts, which
 * cannot be covered by a static hash. A hash-only `script-src` therefore blocks
 * hydration in the browser and the page renders blank after its first paint -
 * exactly the failure this replaces.
 *
 * The fix is a per-request nonce. Middleware generates one, puts the CSP (with
 * the nonce) on the request headers, and Next.js reads it and stamps the nonce
 * onto every script it emits. `'strict-dynamic'` lets those trusted scripts load
 * the chunk files, so `'self'`/host allowlisting is not relied on in modern
 * browsers. The one inline script we author ourselves, the theme bootstrap in
 * layout.tsx, is allowed by its hash, which is honoured even under
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

/**
 * Origins the Privy SDK (and its WalletConnect/Reown wallet plumbing) must reach
 * for auth, embedded wallets, and the wallet picker.
 *
 * These are applied to every document, not just `/app`. CSP is fixed on the HTML
 * document when it is served; a client-side navigation into `/app` keeps the
 * originating page's policy, so scoping these to `/app` would break auth whenever
 * the user arrives via an in-app link. The marketing pages never call these
 * origins, so allowing them is additive permission with no behavioural change.
 */
const PRIVY_CONNECT = [
  "https://auth.privy.io",
  "https://api.privy.io",
  "https://*.privy.io",
  "https://*.rpc.privy.systems",
  "wss://relay.walletconnect.com",
  "wss://relay.walletconnect.org",
  "https://explorer-api.walletconnect.com",
  "https://pulse.walletconnect.org",
  "https://api.web3modal.org",
  "https://*.walletconnect.com",
  "https://*.walletconnect.org",
].join(" ");

const PRIVY_FRAME = [
  "https://auth.privy.io",
  "https://verify.walletconnect.com",
  "https://verify.walletconnect.org",
  "https://challenges.cloudflare.com",
].join(" ");

const PRIVY_IMG = [
  "https://explorer-api.walletconnect.com",
  "https://*.walletconnect.com",
  "https://imagedelivery.net",
].join(" ");

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const nonce = btoa(crypto.randomUUID());

  // Development: the Next dev server uses inline scripts and eval for HMR that a
  // nonce/strict-dynamic policy would block, so dev stays permissive for scripts.
  // Privy's embedded wallet compiles WebAssembly, which needs 'wasm-unsafe-eval'
  // in production (dev's 'unsafe-eval' already covers it).
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${THEME_SCRIPT_HASH} 'wasm-unsafe-eval'`;

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${PRIVY_IMG}`,
    "font-src 'self' data:",
    `connect-src 'self' ${ROBINHOOD_ENDPOINTS} ${PRIVY_CONNECT}${isDev ? " ws: wss:" : ""}`,
    `frame-src 'self' ${PRIVY_FRAME}`,
    "worker-src 'self' blob:",
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
    // Run on documents; skip static assets, the image optimizer, and icons -
    // they are not HTML and do not carry inline scripts.
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)",
    },
  ],
};
