import type { Metadata } from "next";

import { Reveal } from "@/components/reveal";
import { Container, StatusBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Notable changes to HoodStack.",
};

/**
 * Changelog.
 *
 * Mirrors CHANGELOG.md. Nothing has been released, so this shows the unreleased
 * entry rather than inventing version history. Rendered as a timeline: a ruled
 * rail on the left with a marker per entry, sectioned by change type.
 */
type ChangeGroup = {
  label: string;
  tone: "success" | "danger" | "neutral";
  items: string[];
};

interface Entry {
  version: string;
  date: string;
  tone: "pending";
  summary: string;
  groups: ChangeGroup[];
}

const ENTRIES: Entry[] = [
  {
    version: "Unreleased",
    date: "In development",
    tone: "pending",
    summary:
      "Foundation packages and the platform shell. Nothing has been published to npm; no module is enabled.",
    groups: [
      {
        label: "Added",
        tone: "success",
        items: [
          "@hoodstack/errors - normalized error taxonomy with stable HS_ codes, construction-time redaction, and wire round-trip.",
          "@hoodstack/network - Robinhood Chain definitions, chain validation, explorer helpers, RPC health probes, and endpoint fallback.",
          "@hoodstack/config - typed product and module registry driving navigation, routing, and fail-closed availability gating.",
          "@hoodstack/design-tokens - themed token system with dark and light modes and self-hosted typography.",
          "Platform application: landing page, product catalog, docs subsite, and the preview-route system.",
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
          "No token has launched and no token contract has been deployed.",
          "No security audit has been performed.",
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
              Every module activation is recorded here. This mirrors{" "}
              <a
                href="https://github.com/hoodstack/hoodstack/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noreferrer noopener"
                className="text-content-brand hover:underline"
              >
                CHANGELOG.md
              </a>
              . Nothing has been published to npm yet.
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
