import { PRODUCT_LIST, SURFACE_LABELS, getProductModules } from "@hoodstack/config";
import { robinhood, robinhoodTestnet } from "@hoodstack/network";
import Link from "next/link";

import { ExecutionTrace } from "@/components/execution-trace";
import { HoodStackTransform } from "@/components/hoodstack-transform";
import { Reveal } from "@/components/reveal";
import { StackDiagram } from "@/components/stack-diagram";
import {
  ButtonLink,
  CodeBlock,
  Container,
  Panel,
  Section,
  SectionHeading,
} from "@/components/ui";

const SDK_EXAMPLE = `import { HoodStackProvider } from "@hoodstack/react";
import { robinhoodTestnet } from "@hoodstack/network";

export function Providers({ children }) {
  return (
    <HoodStackProvider
      projectId={process.env.NEXT_PUBLIC_HOODSTACK_PROJECT_ID!}
      chain={robinhoodTestnet}
    >
      {children}
    </HoodStackProvider>
  );
}`;

const GUARD_EXAMPLE = `import {
  robinhoodTestnet,
  assertChainMatches,
  assertWriteAllowed,
} from "@hoodstack/network";

// A wallet can switch networks between building and signing.
// Validate immediately before each.
assertChainMatches(await wallet.getChainId(), robinhoodTestnet);

// Mainnet writes are closed by default.
assertWriteAllowed(robinhoodTestnet, { allowMainnetWrites: false });`;

const CAPACITY_FLOW = [
  { step: "Fund", body: "Free allocation, conventional payment, or - later - token." },
  { step: "Credits", body: "Non-transferable, offchain, append-only ledger." },
  { step: "Capacity", body: "API throughput, sponsored gas, webhook volume." },
  { step: "Infrastructure", body: "What your application actually runs on." },
];

const SECURITY_POSTURE = [
  [
    "No key custody",
    "HoodStack cannot move user funds. There is no mechanism and no admin path.",
  ],
  [
    "Server-side policy",
    "Spend limits and allowlists are evaluated before signing. A client check is UX, not a control.",
  ],
  [
    "Chain validation",
    "Chain ID is verified before signing and again before submission.",
  ],
  [
    "Retry safety",
    "Non-idempotent operations are never retried. A broadcast that timed out may already have landed.",
  ],
  [
    "Fail closed",
    "A missing flag or absent configuration disables functionality rather than enabling it.",
  ],
  [
    "Safe errors",
    "No stack trace, SQL, credential, or tenant data crosses a trust boundary.",
  ],
];

export default function HomePage() {
  return (
    <>
      {/* ── hero: headline, then the legacy → HoodStack transform ────────── */}
      <section className="relative overflow-hidden">
        {/* Depth: a single soft radial anchored behind the unified stack. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-6%] top-[8%] hidden h-[600px] w-[600px] rounded-full lg:block"
          style={{
            background:
              "radial-gradient(circle, var(--hs-brand-subtle) 0%, transparent 60%)",
          }}
        />

        <Container className="relative">
          <div className="max-w-3xl pt-14 lg:pt-20">
            <p className="hs-mono-label mb-6 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block size-1.5 rounded-pill bg-brand"
              />
              Robinhood Chain developer infrastructure
            </p>

            <h1 className="hs-display text-[3.25rem] leading-[0.95] text-content sm:text-6xl lg:text-[5.25rem]">
              Build anything on Robinhood&nbsp;Chain.
            </h1>
            <p className="hs-display mt-3 text-3xl text-content-tertiary lg:text-[2.75rem]">
              Everything else is infrastructure.
            </p>

            <p className="mt-8 max-w-xl text-lg text-content-secondary">
              Stop rebuilding accounts, execution, gas, assets, automation, and tooling
              for every project. Adopt one stack and write the part that makes your
              application different.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <ButtonLink href="/docs/quickstart">Start building</ButtonLink>
              <ButtonLink href="/products" variant="secondary">
                Explore the stack
              </ButtonLink>
              <ButtonLink href="https://github.com/hoodstack" variant="ghost" external>
                View GitHub
              </ButtonLink>
            </div>

            <p className="mt-6 hs-mono-label">
              Six concerns, rebuilt every time → one stack
            </p>
          </div>

          {/* The transformation: fragmented legacy consolidating into HoodStack. */}
          <Reveal delay={120}>
            <div className="py-14 lg:py-20">
              <HoodStackTransform />
            </div>
          </Reveal>
        </Container>

        {/* Proof strip: honest facts, not fake logos. Anchors the hero and states
            the value proposition in five words each. */}
        <div className="hs-rule">
          <Container>
            <ul className="grid grid-cols-2 divide-line md:grid-cols-4 lg:grid-cols-5 lg:divide-x">
              {[
                ["Open source", "Apache-2.0, public repo"],
                ["Testnet-first", "Mainnet writes off by default"],
                ["ERC-4337 native", "Smart accounts, sponsored gas"],
                ["Non-custodial", "HoodStack cannot move funds"],
                ["viem-compatible", "Drops into existing tooling"],
              ].map(([title, sub], i) => (
                <li
                  key={title}
                  className={`px-1 py-6 lg:px-6 ${i >= 4 ? "hidden lg:block" : ""}`}
                >
                  <p className="text-sm font-medium text-content">{title}</p>
                  <p className="mt-1 text-xs text-content-tertiary">{sub}</p>
                </li>
              ))}
            </ul>
          </Container>
        </div>
      </section>

      {/* Honest status strip. */}
      <Container>
        <p className="max-w-4xl py-6 text-sm text-content-tertiary">
          HoodStack is pre-release and has not been audited. The network, error, and
          registry packages are implemented and tested; the API, authentication, and SDKs
          are in development. Product pages describe intended design, and say so.
        </p>
      </Container>

      {/* ── the eight products, as a ledger ─────────────────────────────── */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="The platform"
              title="Eight products. One stack."
              lead="Each product is delivered through SDKs, a REST API, a CLI, and the dashboard. You adopt a product, not a package."
            />
          </Reveal>

          <ul className="mt-14 border-b border-line">
            {PRODUCT_LIST.map((product, index) => (
              <Reveal as="li" key={product.id} delay={index * 40}>
                <Link
                  href={product.href}
                  className="group relative grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-2 border-t border-line py-6 transition-[padding] duration-base ease-standard hover:pl-3 lg:grid-cols-[3rem_1fr_auto] lg:gap-x-8"
                >
                  {/* Accent bar that grows on hover. */}
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-6 h-[calc(100%-3rem)] w-px origin-top scale-y-0 bg-brand transition-transform duration-base ease-standard group-hover:scale-y-100"
                  />

                  <span className="hs-tick pt-1 tabular-nums transition-colors group-hover:text-content-brand">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <h3 className="hs-display text-2xl text-content transition-colors group-hover:text-content-brand lg:text-3xl">
                        {product.name}
                      </h3>
                      <span className="hs-mono-label">{product.tagline}</span>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm text-content-secondary">
                      {product.description}
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-x-1 gap-y-1">
                      {getProductModules(product.id).map((module) => (
                        <li
                          key={module.id}
                          className="text-sm text-content-tertiary after:mx-1.5 after:text-content-tertiary after:content-['·'] last:after:content-none"
                        >
                          {module.name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <ul className="hidden shrink-0 flex-col items-end gap-1 lg:flex">
                    {product.surfaces.map((surface) => (
                      <li key={surface} className="hs-tick">
                        {SURFACE_LABELS[surface]}
                      </li>
                    ))}
                  </ul>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ── SDK preview ─────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <Reveal>
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <SectionHeading
                  eyebrow="Developer experience"
                  title="Typed from the first line."
                  lead="One provider wires accounts, transactions, gas, and data into an application. Chain definitions extend viem's Chain, so they drop straight into viem, wagmi, and existing tooling."
                />
                <div className="mt-8">
                  <ButtonLink href="/products/developer" variant="secondary">
                    Developer platform
                  </ButtonLink>
                </div>
              </div>
              <CodeBlock code={SDK_EXAMPLE} label="app/providers.tsx" />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ── architecture ────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Architecture"
              title="Everything under the hood."
              lead="Your application on top. Robinhood Chain underneath. HoodStack is the layer that means you do not rebuild accounts, execution, gas, and data for every project."
            />
            <div className="mt-12">
              <StackDiagram />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ── transaction lifecycle: the signal instrument ────────────────── */}
      <Section>
        <Container>
          <Reveal>
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <SectionHeading
                eyebrow="Execution"
                title="Watch a transaction settle."
                lead="Every transaction moves through the same states - created, simulated, sponsored, submitted, confirmed - and is only reported confirmed once a receipt satisfies the configured finality depth. Nothing is a fabricated metric; this is the real state machine."
              />
              <div className="hs-lift rounded-surface border border-line bg-surface shadow-lg hover:border-line-strong">
                <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                  <span className="hs-mono-label">Transaction lifecycle</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="inline-block size-1.5 rounded-pill bg-brand"
                    />
                    <span className="hs-tick">robinhood-testnet</span>
                  </span>
                </div>
                <div className="p-4">
                  <ExecutionTrace />
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ── chain-native ────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <Reveal>
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <SectionHeading
                  eyebrow="Robinhood Chain native"
                  title="Built for one chain, properly."
                  lead="Not a generic multi-chain toolkit with Robinhood Chain added to a list. Network definitions, gas assumptions, explorer routes, and finality policy are specific to this chain."
                />

                <div className="mt-8 overflow-x-auto">
                  <table className="w-full text-sm">
                    <caption className="sr-only">Robinhood Chain networks</caption>
                    <thead>
                      <tr className="border-b border-line text-left">
                        <th
                          scope="col"
                          className="py-2 pr-4 font-medium text-content-tertiary"
                        >
                          Network
                        </th>
                        <th
                          scope="col"
                          className="py-2 pr-4 font-medium text-content-tertiary"
                        >
                          Chain ID
                        </th>
                        <th
                          scope="col"
                          className="py-2 font-medium text-content-tertiary"
                        >
                          Gas
                        </th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {[robinhood, robinhoodTestnet].map((chain) => (
                        <tr key={chain.id} className="border-b border-line last:border-0">
                          <td className="py-2.5 pr-4 text-content">{chain.name}</td>
                          <td className="py-2.5 pr-4 text-content-secondary">
                            {chain.id}
                          </td>
                          <td className="py-2.5 text-content-secondary">
                            {chain.nativeCurrency.symbol}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 text-sm text-content-tertiary">
                  Testnet is the default. Gas is paid in ETH, and the HoodStack token is
                  not a gas asset on this chain.
                </p>
              </div>

              <CodeBlock code={GUARD_EXAMPLE} label="chain safety" />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ── security, as a ruled ledger ─────────────────────────────────── */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Security model"
              title="Constraints, not adjectives."
              lead="HoodStack has not been audited and does not describe itself as though it has. What it does have are structural constraints, enforced in code and covered by tests."
            />
          </Reveal>

          <dl className="mt-12 border-b border-line">
            {SECURITY_POSTURE.map(([term, description], index) => (
              <Reveal key={term} delay={index * 40}>
                <div className="grid gap-2 border-t border-line py-5 lg:grid-cols-[16rem_1fr] lg:gap-8">
                  <dt className="text-md font-medium text-content">{term}</dt>
                  <dd className="max-w-2xl text-sm text-content-secondary">
                    {description}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>

          <div className="mt-8">
            <ButtonLink href="/security" variant="secondary">
              Security model
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* ── capacity: a pipeline, not cards ─────────────────────────────── */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Network"
              title="Capacity, not speculation."
              lead="Service capacity is denominated in credits. A future token becomes another way to fund them, never a requirement to use the platform, and never a requirement to touch your own funds."
            />
          </Reveal>

          <Reveal>
            <ol className="mt-12 flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line lg:flex-row">
              {CAPACITY_FLOW.map((item, index) => (
                <li key={item.step} className="relative flex-1 bg-surface p-6 lg:p-7">
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

          <Reveal>
            <Panel className="mt-8 p-6">
              <h3 className="text-sm font-medium text-content">Current state</h3>
              <ul className="mt-4 grid gap-3 text-sm text-content-secondary sm:grid-cols-2">
                <li>No token has launched. No contract has been deployed.</li>
                <li>
                  No token is required to create a wallet, sign in, recover access, export
                  an account, or withdraw funds.
                </li>
                <li>Conventional payment options are always available.</li>
                <li>Token documentation is technical architecture, not an offer.</li>
              </ul>
              <div className="mt-6">
                <ButtonLink href="/products/network" variant="secondary">
                  How capacity works
                </ButtonLink>
              </div>
            </Panel>
          </Reveal>
        </Container>
      </Section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <h2 className="hs-display text-3xl text-content">
                  One stack from first account to production scale.
                </h2>
                <p className="mt-3 text-content-secondary">
                  Open source, Apache-2.0, and honest about what works today.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/docs/quickstart">Read the quickstart</ButtonLink>
                <ButtonLink
                  href="https://github.com/hoodstack"
                  variant="secondary"
                  external
                >
                  GitHub
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
