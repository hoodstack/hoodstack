import type { Metadata } from "next";
import { ogImages } from "@/lib/og";

import { Reveal } from "@/components/reveal";
import { Container, StatusBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Changelog",
  openGraph: { images: ogImages("Changelog") },
  description: "Notable changes to HoodStack.",
};

/**
 * Changelog.
 *
 * Mirrors CHANGELOG.md. Rendered as a timeline: a ruled rail on the left with a
 * marker per entry, sectioned by change type. Every item is real; nothing is
 * invented.
 */
type ChangeGroup = {
  label: string;
  tone: "success" | "danger" | "neutral";
  items: string[];
};

interface Entry {
  version: string;
  date: string;
  tone: "success" | "pending";
  summary: string;
  groups: ChangeGroup[];
}

const ENTRIES: Entry[] = [
  {
    version: "0.1.0",
    date: "2026-07-27",
    tone: "success",
    summary:
      "First public packages on npm and the early-access platform: the full read, simulate, configure, and audit surface across the stack.",
    groups: [
      {
        label: "Published to npm",
        tone: "success",
        items: [
          "@hoodstack/errors - normalized error taxonomy with stable HS_ codes, construction-time redaction, and wire round-trip.",
          "@hoodstack/network - Robinhood Chain mainnet (4663) and testnet (46630) definitions, chain validation, explorer and faucet helpers, and a JSON-RPC client with health probes and endpoint fallback.",
          "@hoodstack/sdk - typed TypeScript client over the live REST API: health, gas, RPC, account, transaction, block, and token reads, and transaction simulation.",
          "@hoodstack/cli - the hoodstack terminal client over the same API.",
        ],
      },
      {
        label: "Live in the platform",
        tone: "success",
        items: [
          "25 modules across Identity, Execution, Assets, Connectivity, Security, Developer platform, and Network coordination, each with a dashboard console and, where it applies, a REST endpoint under /api/v1.",
          "One gateway: every request is authenticated by project API key, rate limited, and metered.",
          "A global network switch aligns the whole dashboard to Robinhood Chain testnet or mainnet.",
          "Interactive playground, API reference, and working code recipes over the live endpoints.",
        ],
      },
      {
        label: "Security",
        tone: "danger",
        items: [
          "Non-idempotent RPC methods are never retried and never failed over across endpoints.",
          "JSON-RPC application errors are not retried; only genuinely transient codes are.",
          "RPC endpoint URLs are redacted in every error, log, and health report.",
          "Mainnet writes are disabled by default.",
          "Errors never serialize stack traces or causes across a trust boundary.",
        ],
      },
      {
        label: "Notes",
        tone: "neutral",
        items: [
          "Signed execution and automation (authentication, sessions, sponsored gas, agents, treasury, workflows) are in development, blocked on the account-abstraction write path.",
          "No token has launched and no token contract has been deployed.",
          "No security audit has been performed; keep production-critical flows on testnet.",
        ],
      },
    ],
  },
];

const TONE_TEXT: Record<ChangeGroup["tone"], string> = {
  success: "text-status-success",
  danger: "text-status-danger",
  neutral: "text-content-tertiary",
};

export default function ChangelogPage() {
  return (
    <>
      <Container>
        <div className="border-b border-line py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="hs-mono-label mb-4">Changelog</p>
            <h1 className="hs-display text-4xl text-content lg:text-5xl">
              What changed.
            </h1>
            <p className="mt-5 text-lg text-content-secondary">
              Every package release and module activation is recorded here. This mirrors{" "}
              <a
                href="https://github.com/hoodstack/hoodstack/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noreferrer noopener"
                className="text-content-brand hover:underline"
              >
                CHANGELOG.md
              </a>
              . The first packages are{" "}
              <a
                href="https://www.npmjs.com/~hoodstack"
                target="_blank"
                rel="noreferrer noopener"
                className="text-content-brand hover:underline"
              >
                live on npm
              </a>
              .
            </p>
          </div>
        </div>
      </Container>

      <Container>
        <div className="py-16">
          {ENTRIES.map((entry) => (
            <Reveal key={entry.version}>
              <article className="grid gap-8 lg:grid-cols-[14rem_1fr] lg:gap-12">
                {/* Version rail. */}
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <h2 className="hs-display text-2xl text-content">{entry.version}</h2>
                  <div className="mt-3">
                    <StatusBadge tone={entry.tone}>{entry.date}</StatusBadge>
                  </div>
                  <p className="mt-4 text-sm text-content-secondary">{entry.summary}</p>
                </div>

                {/* Change groups, on a timeline rail. */}
                <div className="border-l border-line pl-6 lg:pl-8">
                  {entry.groups.map((group, gi) => (
                    <div key={group.label} className={gi > 0 ? "mt-10" : ""}>
                      <div className="relative">
                        {/* Marker on the rail. */}
                        <span
                          aria-hidden="true"
                          className={`absolute -left-[calc(1.5rem+1px)] top-1.5 size-2 rounded-pill bg-current lg:-left-[calc(2rem+1px)] ${TONE_TEXT[group.tone]}`}
                        />
                        <h3
                          className={`font-mono text-xs uppercase tracking-wide ${TONE_TEXT[group.tone]}`}
                        >
                          {group.label}
                        </h3>
                      </div>
                      <ul className="mt-4 space-y-3">
                        {group.items.map((item) => {
                          const parts = item.split(" - ");
                          const pkg = parts[0] ?? item;
                          const rest = parts.slice(1);
                          const hasPkg = rest.length > 0 && pkg.startsWith("@");
                          return (
                            <li key={item} className="text-sm text-content-secondary">
                              {hasPkg ? (
                                <>
                                  <code className="font-mono text-content">{pkg}</code>
                                  {" - "}
                                  {rest.join(" - ")}
                                </>
                              ) : (
                                item
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </>
  );
}
