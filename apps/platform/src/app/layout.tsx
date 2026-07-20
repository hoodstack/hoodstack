import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";

import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";

import "./globals.css";

/**
 * Typefaces, self-hosted.
 *
 * `next/font` downloads these at build time and serves them from our own origin,
 * so there is no runtime request to Google and the strict CSP (`font-src 'self'`)
 * is satisfied. The variables are consumed by the design tokens in globals.css.
 *
 * Fraunces is the premium move: a warm editorial serif with optical sizing,
 * echoing the serif-headline strategy Robinhood's rebrand uses to escape
 * "fintech sameness". Inter carries the technical body text; JetBrains Mono the
 * code and instrument readouts.
 */
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  // Variable font: the weight axis stays fluid (set in CSS), and these optional
  // axes add optical sizing and the soft-terminal character. No `weight` here -
  // next/font forbids fixed weights alongside custom axes.
  axes: ["opsz", "SOFT"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hoodstack.io"),
  title: {
    default: "HoodStack - Infrastructure built to scale.",
    template: "%s - HoodStack",
  },
  description:
    "Developer infrastructure for Robinhood Chain: accounts, execution, gas, " +
    "assets, automation, and tooling for production applications.",
  openGraph: {
    type: "website",
    siteName: "HoodStack",
    url: "https://www.hoodstack.io",
    title: "HoodStack - Infrastructure built to scale.",
    description:
      "Developer infrastructure for Robinhood Chain: accounts, execution, gas, " +
      "assets, automation, and tooling for production applications.",
  },
  twitter: { card: "summary_large_image", site: "@hoodstack_" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050605" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the per-request nonce (set by middleware) does two things: it opts
  // rendering into per-request mode, which is what lets Next stamp the nonce onto
  // its streamed scripts so the strict CSP allows them; and it lets us nonce the
  // theme bootstrap below.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <head>
        {/*
          Applies the stored theme before first paint. Must stay inline and
          synchronous - deferring it reintroduces the flash it exists to prevent.
          Allowed by the CSP via both its nonce and its pinned hash (middleware).
        */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-toast focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-on"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
