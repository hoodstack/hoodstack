import type { Metadata } from "next";
import { ogImages } from "@/lib/og";
import Link from "next/link";

import { Reveal } from "@/components/reveal";
import { ButtonLink, CodeBlock, Container, Section, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "AI Agents",
  openGraph: { images: ogImages("AI Agents") },
  description:
    "Give AI agents safe, typed access to Robinhood Chain through HoodStack: read " +
    "chain state, inspect tokens, and simulate transactions, via an MCP server and " +
    "a framework-agnostic toolkit.",
  alternates: { canonical: "/agents" },
};

const MCP_CONFIG = `{
  "mcpServers": {
    "hoodstack": {
      "command": "npx",
      "args": ["-y", "@hoodstack/agent-kit", "hoodstack-mcp"],
      "env": { "HOODSTACK_API_KEY": "hs_test_your_key" }
    }
  }
}`;

const TOOLKIT = `import { createHoodStackAgent } from "@hoodstack/agent-kit";

const agent = createHoodStackAgent({ apiKey: process.env.HOODSTACK_API_KEY! });

// Simulate before acting - nothing is signed or submitted.
const sim = await agent.run("hoodstack_simulate_transaction", {
  to: "0x…",
  valueWei: "10000000000000000",
});`;

const TOOLS = [
  ["hoodstack_health", "Verify the key and report the network and project"],
  ["hoodstack_get_account", "Balance, nonce, and contract detection for an address"],
  ["hoodstack_get_transaction", "A transaction and its receipt, by hash"],
  ["hoodstack_get_block", "A block header (latest by default)"],
  ["hoodstack_get_token", "ERC-20 metadata and an optional holder balance"],
  ["hoodstack_get_gas", "Current gas price, base fee, and transfer cost"],
  ["hoodstack_simulate_transaction", "Simulate a call and estimate gas, no signing"],
  ["hoodstack_rpc", "A read-only JSON-RPC call for anything else"],
] as const;

const GITHUB = "https://github.com/hoodstack/agent-kit";
const NPM = "https://www.npmjs.com/package/@hoodstack/agent-kit";

export default function AgentsPage() {
  return (
    <>
      {/* Hero. */}
      <Container>
        <div className="border-b border-line py-20 lg:py-24">
          <p className="hs-mono-label mb-4">Automation · AI Agents</p>
          <h1 className="hs-display max-w-3xl text-4xl text-content lg:text-5xl">
            Give AI agents a safe way onto Robinhood&nbsp;Chain.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-content-secondary">
            <code className="font-mono text-content">@hoodstack/agent-kit</code> lets an AI
            agent read chain state, inspect tokens, and simulate transactions through
            HoodStack, over the Model Context Protocol or as a framework-agnostic toolkit.
            Every tool is a read or a simulation, so an agent can plan and verify before
            anything is signed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/docs#quickstart">Get an API key</ButtonLink>
            <ButtonLink href={GITHUB} variant="secondary" external>
              View on GitHub
            </ButtonLink>
          </div>
        </div>
      </Container>

      {/* Two surfaces. */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Two ways to use it"
              title="An MCP server and a toolkit."
              lead="One small package. Plug it into an assistant over MCP, or wire the tools into your own agent framework."
            />
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="flex h-full flex-col rounded-card border border-line bg-surface p-6">
                <h3 className="hs-display text-xl text-content">MCP server</h3>
                <p className="mt-2 text-sm text-content-secondary">
                  Expose the tools to any Model Context Protocol client, Claude Desktop,
                  Claude Code, and others, with one config block and your key.
                </p>
                <div className="mt-4">
                  <CodeBlock code={MCP_CONFIG} label="claude_desktop_config.json" />
                </div>
              </div>
            </Reveal>
            <Reveal delay={60}>
              <div className="flex h-full flex-col rounded-card border border-line bg-surface p-6">
                <h3 className="hs-display text-xl text-content">Toolkit</h3>
                <p className="mt-2 text-sm text-content-secondary">
                  Import the tools and run them directly, or adapt them into the Vercel AI
                  SDK, LangChain, or a raw function-calling loop.
                </p>
                <div className="mt-4">
                  <CodeBlock code={TOOLKIT} label="agent.ts" />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* The tools. */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="What an agent can do"
              title="Read and simulate, safely."
              lead="Eight tools over the live HoodStack API. Each is authenticated by your key, rate limited, and metered through one gateway."
            />
          </Reveal>
          <dl className="mt-12 border-b border-line">
            {TOOLS.map(([name, desc], i) => (
              <Reveal key={name} delay={i * 25}>
                <div className="grid gap-x-8 gap-y-1 border-t border-line py-5 lg:grid-cols-[22rem_1fr]">
                  <dt className="font-mono text-sm text-content">{name}</dt>
                  <dd className="text-sm text-content-secondary">{desc}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </Container>
      </Section>

      {/* Safety + roadmap. */}
      <Section>
        <Container>
          <Reveal>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <SectionHeading
                  eyebrow="Non-custodial by construction"
                  title="No key. No custody."
                  lead="The kit only reads and simulates. There is no signing key anywhere in it, and HoodStack cannot move user funds. An agent can inspect and plan without ever being able to spend."
                />
              </div>
              <div className="space-y-6">
                <div className="border-l-2 border-line-brand pl-5">
                  <p className="hs-mono-label mb-2">Live today</p>
                  <p className="text-sm text-content-secondary">
                    Reads and transaction simulation across accounts, transactions, blocks,
                    tokens, gas, and raw read-only RPC, over the live API on testnet and
                    mainnet.
                  </p>
                </div>
                <div className="border-l-2 border-line pl-5">
                  <p className="hs-mono-label mb-2">On the roadmap</p>
                  <p className="text-sm text-content-secondary">
                    Signed, policy-bounded execution: an agent submits from a smart account
                    it owns, bounded by server-side spend limits and allowlists, relayed by
                    HoodStack. Proven on testnet and being wired into the platform. It stays
                    non-custodial, the agent signs, the relayer only relays.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <ButtonLink href={NPM} variant="secondary" external>
                    View on npm
                  </ButtonLink>
                  <Link
                    href="/products/automation"
                    className="inline-flex items-center gap-1.5 self-center text-sm text-content-brand hover:underline"
                  >
                    Automation product
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
