import type { Metadata } from "next";

import { Reveal } from "@/components/reveal";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Security",
  description:
    "HoodStack's security posture, the properties the codebase is built around, " +
    "and how to report a vulnerability.",
};

const PROPERTIES = [
  {
    n: "01",
    title: "No key custody",
    body: "HoodStack does not store private keys, mnemonics, or signing secrets, and cannot move user funds. There is no mechanism, no administrative path, and no recovery flow that produces one. Architectural, not policy.",
  },
  {
    n: "02",
    title: "Tenant isolation",
    body: "A project cannot read or affect another project's data. Queries are scoped at the data-access layer rather than by callers remembering a filter, and public identifiers are opaque and non-enumerable.",
  },
  {
    n: "03",
    title: "Browser/server boundary",
    body: "No server secret is reachable from a client bundle. The boundary is enforced by package structure and lint rules, not by convention.",
  },
  {
    n: "04",
    title: "Chain validation",
    body: "Chain ID is validated immediately before signing and again before submission, because a wallet can switch networks in between. Mainnet writes require an explicit per-project opt-in.",
  },
  {
    n: "05",
    title: "Retry safety",
    body: "Non-idempotent operations are never retried automatically. A transaction broadcast that times out may already have been accepted, so re-sending it risks submitting twice.",
  },
  {
    n: "06",
    title: "Fail closed",
    body: "A missing feature flag, an absent configuration value, or an unrecognized state disables functionality rather than enabling it.",
  },
  {
    n: "07",
    title: "Safe errors",
    body: "Errors never carry stack traces, SQL, provider credentials, internal hostnames, or another tenant's data across a trust boundary. Details are redacted at construction.",
  },
];

const NOT_CLAIMED = [
  "bank-grade",
  "military-grade",
  "unhackable",
  "audited",
  "battle-tested",
  "institutional-grade",
];

const SCOPE = [
  ["Authentication or session bypass", true],
  ["Cross-tenant data access", true],
  ["Privilege escalation within an organization", true],
  ["API key or credential exposure", true],
  ["Webhook signature forgery or replay", true],
  ["Gas sponsorship abuse that bypasses policy", true],
  ["Chain-mismatch or transaction-substitution flaws", true],
  ["Secrets reaching a browser bundle or a log", true],
  ["Rate limits on the shared public RPC endpoints", false],
  ["Missing hardening on endpoints documented as unimplemented", false],
  ["Social engineering, physical attacks, volumetric DoS", false],
] as const;

export default function SecurityPage() {
  return (
    <>
      {/* Header + posture, side by side. Posture first: a reader deciding whether
          to trust this with funds needs the disqualifying facts up front. */}
      <Container>
        <div className="grid gap-10 border-b border-line py-20 lg:grid-cols-[1fr_22rem] lg:gap-16 lg:py-24">
          <div>
            <p className="hs-mono-label mb-4">Security</p>
            <h1 className="hs-display text-4xl text-content lg:text-5xl">
              Constraints, not adjectives.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-content-secondary">
              What HoodStack actually guarantees, what it does not, and how to tell us
              when we are wrong.
            </p>
          </div>

          <Reveal>
            <div className="rounded-surface border border-line bg-status-warning-bg p-5">
              <p className="hs-mono-label" style={{ color: "var(--hs-status-warning)" }}>
                Current posture
              </p>
              <p className="mt-3 text-sm text-content-secondary">
                Pre-release, and <strong className="text-content">not audited</strong>. No
                independent security review. No funded bug bounty. Do not use HoodStack to
                secure funds you cannot afford to lose.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>

      {/* Properties, as a numbered ledger. */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Guarantees"
              title="Properties we hold ourselves to."
              lead="A defect in any of these is a vulnerability, not a feature request."
            />
          </Reveal>

          <dl className="mt-12 border-b border-line">
            {PROPERTIES.map((p, i) => (
              <Reveal key={p.title} delay={i * 40}>
                <div className="grid grid-cols-[3rem_1fr] items-baseline gap-x-6 border-t border-line py-6 lg:grid-cols-[3rem_18rem_1fr] lg:gap-x-10">
                  <dt className="hs-tick tabular-nums text-content-tertiary">{p.n}</dt>
                  <dt className="text-md font-medium text-content">{p.title}</dt>
                  <dd className="col-start-2 mt-2 max-w-2xl text-sm text-content-secondary lg:col-start-3 lg:mt-0">
                    {p.body}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </Container>
      </Section>

      {/* What we do not claim. */}
      <Section>
        <Container>
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-[22rem_1fr] lg:gap-16">
              <SectionHeading
                eyebrow="Honesty"
                title="What we do not claim."
                lead="None of these would be true today, so none of them appear on this site."
              />
              <ul className="flex flex-wrap content-start gap-2">
                {NOT_CLAIMED.map((claim) => (
                  <li
                    key={claim}
                    className="rounded-pill border border-line px-3 py-1.5 font-mono text-sm text-content-tertiary line-through"
                  >
                    {claim}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Scope. */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Reporting scope"
              title="What counts as a vulnerability."
            />
          </Reveal>
          <ul className="mt-10 grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {SCOPE.map(([label, inScope], i) => (
              <Reveal key={String(label)} delay={i * 30}>
                <li className="flex items-start gap-3 border-t border-line py-3 text-sm">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 font-mono text-xs ${
                      inScope ? "text-content-brand" : "text-content-tertiary"
                    }`}
                  >
                    {inScope ? "in" : "out"}
                  </span>
                  <span
                    className={
                      inScope ? "text-content-secondary" : "text-content-tertiary"
                    }
                  >
                    {label}
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Reporting. */}
      <Section>
        <Container>
          <Reveal>
            <div className="rounded-surface border border-line bg-surface p-8 lg:p-10">
              <SectionHeading title="Reporting a vulnerability" />
              <div className="mt-6 max-w-2xl space-y-4 text-content-secondary">
                <p>
                  Report privately. Do not open a public issue for a security problem.
                </p>
                <p>
                  Good-faith research under our disclosure policy is protected by safe
                  harbour. There is no funded bounty at this time, and we will not imply
                  otherwise to attract reports. The findings we most want are ones where
                  something we claim — tenant isolation, chain validation, redaction,
                  non-custody — does not actually hold.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="mailto:security@hoodstack.io">
                  security@hoodstack.io
                </ButtonLink>
                <ButtonLink
                  href="https://github.com/hoodstack/hoodstack/security/advisories/new"
                  variant="secondary"
                  external
                >
                  Private report on GitHub
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
