import { robinhood, robinhoodTestnet } from "@hoodstack/network";
import type { Metadata } from "next";
import { ogImages } from "@/lib/og";
import Link from "next/link";

import { CodeBlock } from "@/components/ui";

export const metadata: Metadata = {
  title: "Documentation",
  openGraph: { images: ogImages("Documentation") },
  description:
    "Guides and reference for building on Robinhood Chain with HoodStack: " +
    "authentication, the Data API, and the network and error packages.",
};

const INSTALL = `pnpm add @hoodstack/sdk @hoodstack/network @hoodstack/errors`;

const NETWORK_USAGE = `import {
  robinhoodTestnet,
  assertChainMatches,
  assertWriteAllowed,
  getExplorerTxUrl,
} from "@hoodstack/network";

// Chain definitions extend viem's Chain - hand them straight to
// createPublicClient, wagmi, or any viem-compatible tooling.
const chain = robinhoodTestnet; // testnet is the default everywhere

// A wallet can switch networks between building and signing.
// Validate the chain immediately before each.
assertChainMatches(await wallet.getChainId(), chain);

// Mainnet writes are disabled by default; enabling them is explicit.
assertWriteAllowed(chain, { allowMainnetWrites: false });

const url = getExplorerTxUrl(chain, txHash);`;

const HEALTH_CURL = `curl https://www.hoodstack.io/api/v1/health \\
  -H "Authorization: Bearer hs_test_your_key"`;

const ACCOUNT_CURL = `curl 'https://www.hoodstack.io/api/v1/data/account?address=0xYOUR_ADDRESS' \\
  -H "Authorization: Bearer hs_test_your_key"`;

const ACCOUNT_RESPONSE = `{
  "ok": true,
  "requestId": "b1a7…",
  "data": {
    "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "chainId": 46630,
    "balanceWei": "1000000000000000000",
    "balanceFormatted": "1 ETH",
    "nonce": 42,
    "isContract": false
  }
}`;

const RPC_CURL = `curl -X POST https://www.hoodstack.io/api/v1/rpc \\
  -H "Authorization: Bearer hs_test_your_key" \\
  -H "content-type: application/json" \\
  -d '{"method":"eth_blockNumber"}'`;

const AGENT_MCP = `{
  "mcpServers": {
    "hoodstack": {
      "command": "npx",
      "args": ["-y", "@hoodstack/agent-kit", "hoodstack-mcp"],
      "env": { "HOODSTACK_API_KEY": "hs_test_your_key" }
    }
  }
}`;

const AGENT_TOOLKIT = `import { createHoodStackAgent } from "@hoodstack/agent-kit";

const agent = createHoodStackAgent({ apiKey: process.env.HOODSTACK_API_KEY! });

// Every tool is a read or a simulation - nothing is signed or submitted.
const gas = await agent.run("hoodstack_get_gas", {});
const sim = await agent.run("hoodstack_simulate_transaction", {
  to: "0x…",
  valueWei: "10000000000000000",
});`;

const AGENT_TOOLS: readonly (readonly [string, string])[] = [
  ["hoodstack_health", "Verify the key and report the network and project"],
  ["hoodstack_get_account", "Balance, nonce, and contract detection for an address"],
  ["hoodstack_get_transaction", "A transaction and its receipt, by hash"],
  ["hoodstack_get_block", "A block header (latest by default)"],
  ["hoodstack_get_token", "ERC-20 metadata and an optional holder balance"],
  ["hoodstack_get_gas", "Current gas price, base fee, and transfer cost"],
  ["hoodstack_simulate_transaction", "Simulate a call and estimate gas, no signing"],
  ["hoodstack_rpc", "A read-only JSON-RPC call for anything else"],
];

const ERROR_USAGE = `import { isHoodStackError } from "@hoodstack/errors";

try {
  const account = await hoodstack.data.account(address);
} catch (error) {
  if (isHoodStackError(error)) {
    error.code;      // e.g. "HS_INVALID_API_KEY" - branch on this
    error.retryable; // whether retrying may help
    error.docsUrl;   // where to read more
    error.requestId; // correlate with server logs
  }
}`;

/** A section heading that doubles as a scroll anchor for the sidebar. */
function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 border-t border-line py-10 first:border-0 first:pt-0"
    >
      <h2 className="hs-display text-2xl text-content lg:text-3xl">{title}</h2>
      <div className="mt-5 space-y-4 text-content-secondary">{children}</div>
    </section>
  );
}

const NPM = "https://www.npmjs.com/package";

const PACKAGES: { name: string; desc: string; npm: string }[] = [
  {
    name: "@hoodstack/sdk",
    desc: "Typed TypeScript client for the API",
    npm: `${NPM}/@hoodstack/sdk`,
  },
  {
    name: "@hoodstack/cli",
    desc: "The hoodstack terminal client",
    npm: `${NPM}/@hoodstack/cli`,
  },
  {
    name: "@hoodstack/network",
    desc: "Robinhood Chain definitions and read helpers",
    npm: `${NPM}/@hoodstack/network`,
  },
  {
    name: "@hoodstack/errors",
    desc: "Normalized HS_ error taxonomy",
    npm: `${NPM}/@hoodstack/errors`,
  },
];

export default function DocsHomePage() {
  return (
    <>
      <div className="pb-4">
        <p className="hs-mono-label mb-3">Documentation</p>
        <h1 className="hs-display text-4xl text-content lg:text-5xl">
          Build on HoodStack
        </h1>
        <p className="mt-4 text-lg text-content-secondary">
          Developer infrastructure for Robinhood Chain. Create a project, mint an API
          key, and read chain state through the Data API in minutes.
        </p>

        <div className="mt-6 rounded-card border border-line bg-surface-inset p-4 text-sm text-content-secondary">
          <strong className="text-content">Status.</strong> The full read, simulate,
          configure, and audit surface is live across the stack, with a typed SDK and CLI
          on npm; signed execution and automation ship continuously. HoodStack is in early
          access and not yet audited; keep production-critical flows on testnet until a
          mainnet readiness review is announced.
        </div>
      </div>

      <DocSection id="introduction" title="Introduction">
        <p>
          HoodStack is the developer infrastructure stack for Robinhood Chain: accounts,
          execution, gas, assets, connectivity, automation, security, and developer
          tooling, delivered through SDKs, a REST API, a CLI, and a dashboard.
        </p>
        <p>
          It is non-custodial by design - HoodStack cannot move user funds - and testnet
          is the default everywhere. See the{" "}
          <Link href="/products" className="text-content-brand hover:underline">
            product catalog
          </Link>{" "}
          for the full stack.
        </p>
      </DocSection>

      <DocSection id="installation" title="Installation">
        <p>Requires Node 20.11+ and pnpm 10+. Install the packages you need:</p>
        <CodeBlock code={INSTALL} label="terminal" />
        <p className="text-sm text-content-tertiary">
          Four packages are on npm today:{" "}
          <code className="font-mono">@hoodstack/sdk</code>,{" "}
          <code className="font-mono">@hoodstack/cli</code>,{" "}
          <code className="font-mono">@hoodstack/network</code>, and{" "}
          <code className="font-mono">@hoodstack/errors</code>.
        </p>
      </DocSection>

      <DocSection id="network" title="Network setup">
        <p>
          Two networks are defined. Testnet is the default; selecting mainnet is always
          explicit, and mainnet writes require a per-project opt-in.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="py-2 pr-4 font-medium text-content-tertiary">Network</th>
                <th className="py-2 pr-4 font-medium text-content-tertiary">Chain ID</th>
                <th className="py-2 font-medium text-content-tertiary">Gas</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {[robinhood, robinhoodTestnet].map((chain) => (
                <tr key={chain.id} className="border-b border-line last:border-0">
                  <td className="py-2.5 pr-4 text-content">{chain.name}</td>
                  <td className="py-2.5 pr-4 text-content-secondary">{chain.id}</td>
                  <td className="py-2.5 text-content-secondary">
                    {chain.nativeCurrency.symbol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Testnet ETH is available from the{" "}
          <a
            href="https://faucet.testnet.chain.robinhood.com"
            target="_blank"
            rel="noreferrer noopener"
            className="text-content-brand hover:underline"
          >
            faucet
          </a>
          . The <code className="font-mono">@hoodstack/network</code> package provides the
          definitions and the safety rails around them:
        </p>
        <CodeBlock code={NETWORK_USAGE} label="network.ts" />
      </DocSection>

      <DocSection id="quickstart" title="Quickstart">
        <p>Three steps take you from nothing to a live read against the chain.</p>
        <ol className="ml-1 mt-2 space-y-3 text-content-secondary">
          <li className="flex gap-3">
            <span className="font-mono text-sm text-content-brand">1</span>
            <span>
              Sign in to the{" "}
              <Link href="/app/projects" className="text-content-brand hover:underline">
                dashboard
              </Link>{" "}
              and create a project.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-sm text-content-brand">2</span>
            <span>
              In the project, create a <strong className="text-content">Test</strong> API
              key. Copy it once; it is shown only at creation.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-sm text-content-brand">3</span>
            <span>Call the gateway with your key.</span>
          </li>
        </ol>
        <CodeBlock code={HEALTH_CURL} label="verify your key" />
        <p>
          A <code className="font-mono">200</code> confirms the key resolves and reports
          the chain it acts against. Test keys act against Robinhood Chain testnet; live
          keys against mainnet.
        </p>
      </DocSection>

      <DocSection id="authentication" title="Authentication">
        <p>
          Every API request carries a project API key as a bearer token. Keys are stored
          only as a hash, so a lost key is rotated, never recovered; create a new one and
          revoke the old.
        </p>
        <CodeBlock
          code={'Authorization: Bearer hs_test_…   (or hs_live_… for mainnet)'}
          label="header"
        />
        <p>
          A missing or revoked key returns{" "}
          <code className="font-mono">HS_INVALID_API_KEY</code>; requests are rate limited
          per key. Keys can also be sent as{" "}
          <code className="font-mono">x-api-key</code>.
        </p>
      </DocSection>

      <DocSection id="data-api" title="Data API">
        <p>
          Read chain state over raw RPC. Responses share one envelope:{" "}
          <code className="font-mono">{"{ ok, requestId, data }"}</code> on success, and{" "}
          <code className="font-mono">{"{ ok: false, error }"}</code> with a stable{" "}
          <code className="font-mono">HS_</code> code on failure.
        </p>
        <ul className="ml-1 space-y-1.5 text-sm">
          <li>
            <code className="font-mono text-content">GET /api/v1/data/account?address=</code>{" "}
            balance, nonce, and contract detection
          </li>
          <li>
            <code className="font-mono text-content">GET /api/v1/data/transaction?hash=</code>{" "}
            a transaction with its receipt
          </li>
          <li>
            <code className="font-mono text-content">GET /api/v1/data/block?number=latest</code>{" "}
            a block header
          </li>
        </ul>
        <CodeBlock code={ACCOUNT_CURL} label="account read" />
        <CodeBlock code={ACCOUNT_RESPONSE} label="response" />
        <p>
          For arbitrary read-only JSON-RPC, post to{" "}
          <code className="font-mono">/api/v1/rpc</code>:
        </p>
        <CodeBlock code={RPC_CURL} label="raw RPC" />
      </DocSection>

      <DocSection id="agents" title="AI agents">
        <p>
          <code className="font-mono">@hoodstack/agent-kit</code> gives an AI agent safe,
          typed access to Robinhood Chain through a project API key. One small package ships
          two things: an <strong className="text-content">MCP server</strong> for any Model
          Context Protocol client, and a{" "}
          <strong className="text-content">framework-agnostic toolkit</strong> for the Vercel
          AI SDK, LangChain, or a raw function-calling loop.
        </p>
        <p>
          Every tool is a <strong className="text-content">read or a simulation</strong>, so
          an agent can plan and verify before anything is signed. There is no signing key in
          the package, and HoodStack cannot move user funds.
        </p>
        <p>Point an MCP client (Claude Desktop, Claude Code) at it and set your key:</p>
        <CodeBlock code={AGENT_MCP} label="claude_desktop_config.json" />
        <p>Or import the tools into your own agent:</p>
        <CodeBlock code={AGENT_TOOLKIT} label="agent.ts" />
        <p>Eight tools, each authenticated by your key and metered through the gateway:</p>
        <ul className="ml-1 space-y-1.5 text-sm">
          {AGENT_TOOLS.map(([name, desc]) => (
            <li key={name}>
              <code className="font-mono text-content">{name}</code> — {desc}
            </li>
          ))}
        </ul>
        <p className="text-sm text-content-tertiary">
          Signed, policy-bounded execution — an agent submitting from a smart account it
          owns, bounded by server-side spend limits and allowlists, relayed by HoodStack — is
          on the account-abstraction roadmap. It stays non-custodial: the agent signs, the
          relayer only relays. Read the overview on the{" "}
          <Link href="/agents" className="text-content-brand hover:underline">
            AI Agents page
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="errors" title="Error handling">
        <p>
          Every HoodStack error is a <code className="font-mono">HoodStackError</code>{" "}
          with a stable <code className="font-mono">HS_</code> code you can branch on, a
          retryable flag, a documentation URL, and a request ID. Details are redacted at
          construction, so secrets never reach a log or a client.
        </p>
        <CodeBlock code={ERROR_USAGE} label="errors.ts" />
      </DocSection>

      <DocSection id="packages" title="Packages">
        <p>Published on npm, Apache-2.0.</p>
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line">
          {PACKAGES.map((pkg) => (
            <li
              key={pkg.name}
              className="flex flex-col gap-1 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <a
                  href={pkg.npm}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-mono text-sm text-content hover:text-content-brand"
                >
                  {pkg.name}
                </a>
                <p className="text-xs text-content-tertiary">{pkg.desc}</p>
              </div>
              <a
                href={pkg.npm}
                target="_blank"
                rel="noreferrer noopener"
                className="shrink-0 font-mono text-xs text-content-brand hover:underline"
              >
                npm ↗
              </a>
            </li>
          ))}
        </ul>
      </DocSection>
    </>
  );
}
