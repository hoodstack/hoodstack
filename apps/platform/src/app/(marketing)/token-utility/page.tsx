import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/reveal";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Token utility",
  description:
    "How a future HoodStack token would coordinate infrastructure capacity — " +
    "and the hard boundaries it will never cross. Technical architecture, not an offer.",
  alternates: { canonical: "/token-utility" },
};

/** The capacity model: credits are the abstraction; the token is one funding source. */
const CAPACITY_FLOW = [
  {
    step: "Fund",
    body: "Free allocation, conventional fiat or stablecoin payment, or — after launch — verified token stake and token-funded credits.",
  },
  {
    step: "Credits",
    body: "A non-transferable, offchain, append-only ledger, denominated clearly and tied to actual service consumption. Not tokenized, not speculative.",
  },
  {
    step: "Capacity",
    body: "API throughput, sponsored gas, webhook delivery, account operations, simulation, data — what the credits buy.",
  },
  {
    step: "Infrastructure",
    body: "What your application actually runs on. The token coordinates access to it; it is never the thing itself.",
  },
];

/** The seven utility pillars, each with the constraint that keeps it honest. */
const PILLARS = [
  {
    n: "01",
    title: "Developer capacity",
    body: "Stake to unlock or raise API capacity, account allowances, sponsored-transaction capacity, webhook throughput, advanced policies, priority processing, and premium environments.",
    constraint:
      "Conventional fiat and stablecoin payment always remains. No capacity tier is token-only.",
  },
  {
    n: "02",
    title: "Gas sponsorship entitlements",
    body: "Token staking or token-funded credits translate into sponsored gas limits, campaign budgets, account-level sponsorship, and higher policy capacity.",
    constraint:
      "Gas on Robinhood Chain is paid in ETH. The HoodStack token is never the gas asset.",
  },
  {
    n: "03",
    title: "Infrastructure operator bonding",
    body: "Future operators bond to provide bundler services, paymaster liquidity, RPC routing, simulation, indexing, webhook execution, and security modules.",
    constraint:
      "Slashing is not implemented until objective evidence, challenge periods, a dispute process, bounded penalties, review, tests, and an audit are defined first.",
  },
  {
    n: "04",
    title: "Agent collateral",
    body: "Autonomous or delegated accounts bond to establish economic identity, unlock higher limits, access service marketplaces, provide dispute collateral, and carry reputation continuity.",
    constraint:
      "Collateral never replaces cryptographic permission controls. Bonding is economic, not a key.",
  },
  {
    n: "05",
    title: "Security module participation",
    body: "Providers bond to offer transaction simulation, fraud detection, contract screening, recovery modules, compliance adapters, and policy checks.",
    constraint: "A bonded module proposes; it never overrides a user's own controls.",
  },
  {
    n: "06",
    title: "Ecosystem incentives",
    body: "Coordinate developer grants, public-goods funding, integration incentives, testnet campaigns, security research, and operator rewards.",
    constraint: "Rewards follow measurable contribution, never vanity activity.",
  },
  {
    n: "07",
    title: "Governance",
    body: "Bounded protocol matters: ecosystem grants, supported modules, operator requirements, treasury policy, fee ranges, public-goods funding, and registry proposals.",
    constraint: "Strictly bounded — see what governance can never touch, below.",
  },
];

/** Hard boundaries. These are the trust guarantees the token must never break. */
const NEVER_REQUIRED = [
  "Create a wallet",
  "Sign in",
  "Recover access",
  "Export an account",
  "Withdraw your funds",
  "Any ordinary account-safety operation",
];

const GOVERNANCE_NEVER = [
  "User keys",
  "User balances",
  "Arbitrary user transactions",
  "Recovery without user authorization",
  "Unrestricted contract upgrades",
];

export default function TokenUtilityPage() {
  return (
    <>
      {/* Hero. */}
      <Container>
        <div className="border-b border-line py-20 lg:py-24">
          <p className="hs-mono-label mb-4">Network · Token utility</p>
          <h1 className="hs-display max-w-3xl text-4xl text-content lg:text-5xl">
            Coordinate capacity. Never gate safety.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-content-secondary">
            A future HoodStack token exists to coordinate infrastructure usage — developer
            capacity, sponsored gas, operator bonding, agent collateral, and bounded
            governance. It is designed around real service consumption, not speculation,
            and it never stands between you and your own funds.
          </p>
        </div>
      </Container>

      {/* Current state — prominent and honest. */}
      <Container>
        <Reveal>
          <div className="mt-8 rounded-surface border border-line bg-status-warning-bg p-6 lg:p-8">
            <p className="hs-mono-label" style={{ color: "var(--hs-status-warning)" }}>
              Current state
            </p>
            <div className="mt-4 grid gap-4 text-sm text-content-secondary sm:grid-cols-2">
              <p>
                <strong className="text-content">No token has launched.</strong> No token
                contract has been deployed. Nothing on this page is an offer.
              </p>
              <p>
                <strong className="text-content">Nothing here is decided.</strong> Ticker,
                supply, allocation, vesting, and launch timing are undetermined and are
                not stated anywhere.
              </p>
              <p>
                The platform is fully usable today without any token, funded by free
                allocation and conventional payment.
              </p>
              <p>
                A token launches only after Phase 1 is stable — never automatically, and
                never before the product stands on its own.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>

      {/* Credits first. */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="The abstraction"
              title="Credits are the unit. The token is one way to fund them."
              lead="Service capacity is denominated in usage credits — today, and after any token launch. A token becomes an additional funding source that translates into credits through an entitlement adapter; it never becomes a second, parallel system."
            />
          </Reveal>

          <Reveal>
            <ol className="mt-12 flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line lg:flex-row">
              {CAPACITY_FLOW.map((item, index) => (
                <li key={item.step} className="relative flex-1 bg-surface p-6">
                  <div className="flex items-center gap-3">
                    <span className="hs-tick tabular-nums text-content-brand">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="hs-display text-lg text-content">{item.step}</h3>
                    {index < CAPACITY_FLOW.length - 1 ? (
                      <span aria-hidden="true" className="ml-auto text-content-tertiary">
                        →
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-content-secondary">{item.body}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </Container>
      </Section>

      {/* The pillars. */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="What it coordinates"
              title="Seven utilities, each with a limit."
              lead="Every pillar carries the constraint that keeps it from becoming a way to bypass a control or manufacture speculation."
            />
          </Reveal>

          <dl className="mt-12 border-b border-line">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 30}>
                <div className="grid gap-x-8 gap-y-3 border-t border-line py-7 lg:grid-cols-[3rem_1fr]">
                  <dt className="hs-tick tabular-nums text-content-tertiary">{p.n}</dt>
                  <div>
                    <dt className="hs-display text-xl text-content">{p.title}</dt>
                    <dd className="mt-3 max-w-2xl text-sm text-content-secondary">
                      {p.body}
                    </dd>
                    <dd className="mt-3 flex max-w-2xl gap-2 text-sm">
                      <span className="hs-mono-label shrink-0 pt-0.5 text-content-brand">
                        Limit
                      </span>
                      <span className="text-content-tertiary">{p.constraint}</span>
                    </dd>
                  </div>
                </div>
              </Reveal>
            ))}
          </dl>
        </Container>
      </Section>

      {/* Hard boundaries. */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="The boundaries"
              title="What the token never does."
              lead="Token accounting is a separate system from authentication, wallet ownership, recovery, and user balances. These lines are architectural, not policy — they cannot be voted away."
            />
          </Reveal>

          <div className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line lg:grid-cols-2">
            <div className="bg-surface p-6 lg:p-8">
              <h3 className="text-md font-medium text-content">Never required to</h3>
              <p className="mt-2 text-sm text-content-tertiary">
                No token is needed for any account-safety operation.
              </p>
              <ul className="mt-5 space-y-2.5">
                {NEVER_REQUIRED.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 font-mono text-content-brand"
                    >
                      free
                    </span>
                    <span className="text-content-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface p-6 lg:p-8">
              <h3 className="text-md font-medium text-content">
                Governance can never control
              </h3>
              <p className="mt-2 text-sm text-content-tertiary">
                Governance is bounded to protocol matters only.
              </p>
              <ul className="mt-5 space-y-2.5">
                {GOVERNANCE_NEVER.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 font-mono text-content-tertiary line-through"
                    >
                      no
                    </span>
                    <span className="text-content-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* Evolution. */}
      <Section>
        <Container>
          <Reveal>
            <div className="grid gap-10 lg:grid-cols-[22rem_1fr] lg:gap-16">
              <SectionHeading
                eyebrow="How it evolves"
                title="Same route, before and after."
                lead="Nothing about this changes the URL or breaks what already works."
              />
              <div className="space-y-6">
                <div className="border-l-2 border-line pl-5">
                  <p className="hs-mono-label mb-2">Today, before any token</p>
                  <p className="text-sm text-content-secondary">
                    Capacity runs entirely on the offchain credit ledger, funded by free
                    allocation and conventional payment. Your dashboard shows real usage,
                    real credit balance, and current capacity — never a fake balance,
                    stake, APR, reward, or governance proposal.
                  </p>
                </div>
                <div className="border-l-2 border-line-brand pl-5">
                  <p className="hs-mono-label mb-2">After launch</p>
                  <p className="text-sm text-content-secondary">
                    A token entitlement adapter translates verified stake, token-funded
                    credits, and operator bonds into the same credits, reconciled only
                    against finalized chain state. The route{" "}
                    <code className="font-mono text-xs">/token-utility</code> deepens in
                    place. Token accounting stays separate from auth, wallet ownership,
                    recovery, and user balances.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Naming + legal. */}
      <Section>
        <Container>
          <Reveal>
            <div className="rounded-surface border border-line bg-surface p-6 lg:p-8">
              <h3 className="text-sm font-medium text-content">On naming</h3>
              <p className="mt-3 max-w-3xl text-sm text-content-secondary">
                Internally we refer to a future token as{" "}
                <code className="font-mono text-content">$HOOD</code>. This is a
                provisional working identifier, not a final ticker. Nothing about the
                name, supply, allocation, vesting, price, liquidity, or listing is
                decided, and none of it appears anywhere on this site.
              </p>
              <p className="mt-4 max-w-3xl text-xs leading-relaxed text-content-tertiary">
                This page is technical architecture, not an offer, a solicitation, or a
                promise of any return. It contains no price prediction, market-cap target,
                buyback, yield, or revenue-share commitment. HoodStack does not provide
                investment advice. The HoodStack token has not launched.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/products/network" variant="secondary">
                  How capacity works
                </ButtonLink>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 self-center text-sm text-content-brand hover:underline"
                >
                  Explore the stack
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
