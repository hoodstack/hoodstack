import { robinhoodTestnet } from "@hoodstack/network";
import Link from "next/link";

import { BrandMark } from "@/components/brand";
import { ButtonLink, Container } from "@/components/ui";

interface StatusItem {
  readonly label: string;
  readonly value: string;
  readonly dot?: boolean;
  readonly mono?: boolean;
}

const STATUS: readonly StatusItem[] = [
  { label: "Network", value: robinhoodTestnet.name, dot: true },
  { label: "Chain ID", value: String(robinhoodTestnet.id), mono: true },
  { label: "Status", value: "Pre-release" },
  { label: "License", value: "Apache-2.0" },
];

const COLUMNS = [
  {
    heading: "Platform",
    links: [
      { href: "/products", label: "Products" },
      { href: "/products/developer", label: "SDKs" },
      { href: "/products/developer", label: "CLI" },
      { href: "/products/token-utility", label: "Token utility" },
    ],
  },
  {
    heading: "Developers",
    links: [
      // Docs is a separate site; open it in a new tab.
      { href: "/docs", label: "Documentation", external: true },
      { href: "/docs#quickstart", label: "Quickstart", external: true },
      { href: "/docs#errors", label: "Error handling", external: true },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    heading: "Project",
    links: [
      { href: "/security", label: "Security" },
      { href: "https://github.com/hoodstack", label: "GitHub", external: true },
      { href: "https://x.com/hoodstack_", label: "X", external: true },
    ],
  },
];

/**
 * Site footer.
 *
 * One brand mark, not two. A brand-and-status band, a conversion cell paired
 * with the navigation columns so no cell is left empty, then the required legal
 * disclaimer. Every value shown is real; nothing is invented.
 */
export function SiteFooter() {
  return (
    <footer className="hs-rule mt-8 bg-surface">
      <Container>
        {/* Brand and live status. */}
        <div className="flex flex-col gap-8 py-12 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <BrandMark className="size-8 text-content-brand" />
              <span className="hs-display text-3xl text-content">HoodStack</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-content-secondary">
              Developer infrastructure for Robinhood Chain. Infrastructure built to scale.
            </p>
          </div>

          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            {STATUS.map((item) => (
              <div key={item.label}>
                <dt className="hs-tick">{item.label}</dt>
                <dd
                  className={`mt-1 flex items-center gap-2 text-sm text-content ${
                    item.mono ? "font-mono" : ""
                  }`}
                >
                  {item.dot ? (
                    <span
                      aria-hidden="true"
                      className="inline-block size-1.5 rounded-pill bg-brand"
                    />
                  ) : null}
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Conversion cell + navigation. Four equal cells, so none sits empty. */}
        <div className="grid gap-x-8 gap-y-10 border-t border-line py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="hs-display text-xl text-content">
              Start building on Robinhood Chain.
            </p>
            <p className="mt-2 max-w-xs text-sm text-content-secondary">
              Testnet is the default. No token required.
            </p>
            <div className="mt-5">
              <ButtonLink href="/docs/quickstart">Start building</ButtonLink>
            </div>
          </div>

          {COLUMNS.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="hs-mono-label mb-4">{group.heading}</h2>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={`${group.heading}-${link.label}`}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="hs-link text-sm text-content-secondary transition-colors hover:text-content"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="hs-link text-sm text-content-secondary transition-colors hover:text-content"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Legal. Visible on every marketing page; the association it disclaims
            is one a reader might otherwise reasonably infer from the name. */}
        <div className="hs-rule space-y-3 py-8 text-xs leading-relaxed text-content-tertiary">
          <p className="max-w-4xl">
            HoodStack is an independent developer infrastructure project and is not
            affiliated with, endorsed by, sponsored by, or operated by Robinhood Markets,
            Inc. or its affiliates. Robinhood and Robinhood Chain are trademarks of their
            respective owners.
          </p>
          <p className="max-w-4xl">
            HoodStack does not provide brokerage services and does not provide investment
            advice. Asset availability may depend on jurisdiction. Developers remain
            responsible for their own legal and compliance obligations. Token utility
            documentation is technical architecture, not an offer. The HoodStack token has
            not launched.
          </p>
          <p className="pt-2">© {new Date().getFullYear()} HoodStack · Apache-2.0</p>
        </div>
      </Container>
    </footer>
  );
}
