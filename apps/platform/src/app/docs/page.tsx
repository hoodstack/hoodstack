import { robinhood, robinhoodTestnet } from "@hoodstack/network";
import type { Metadata } from "next";
import Link from "next/link";

import { CodeBlock } from "@/components/ui";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Guides and reference for building on Robinhood Chain with HoodStack. " +
    "Architecture and security docs are complete; product guides are in progress.",
};

const INSTALL = `pnpm add @hoodstack/network @hoodstack/errors`;

const NETWORK_USAGE = `import {
  robinhoodTestnet,
  assertChainMatches,
  assertWriteAllowed,
  getExplorerTxUrl,
} from "@hoodstack/network";

// Chain definitions extend viem's Chain — hand them straight to
// createPublicClient, wagmi, or any viem-compatible tooling.
const chain = robinhoodTestnet; // testnet is the default everywhere

// A wallet can switch networks between building and signing.
// Validate the chain immediately before each.
assertChainMatches(await wallet.getChainId(), chain);

// Mainnet writes are disabled by default; enabling them is explicit.
assertWriteAllowed(chain, { allowMainnetWrites: false });

const url = getExplorerTxUrl(chain, txHash);`;

const QUICKSTART = `import { HoodStackProvider } from "@hoodstack/react";
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

const ERROR_USAGE = `import { HoodStackError, isHoodStackError } from "@hoodstack/errors";

try {
  await hoodstack.transactions.send(input);
} catch (error) {
  if (isHoodStackError(error)) {
    error.code;      // e.g. "HS_CHAIN_MISMATCH" — branch on this
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

const PACKAGES = [
  ["@hoodstack/errors", "Normalized HS_ error taxonomy", "Implemented"],
  ["@hoodstack/network", "Chain definitions, validation, RPC utilities", "Implemented"],
  ["@hoodstack/config", "Typed product and module registry", "Implemented"],
  ["@hoodstack/design-tokens", "Themed design tokens", "Implemented"],
  [
    "@hoodstack/sdk · react · server",
    "Browser, React, and server SDKs",
    "In development",
  ],
  ["@hoodstack/cli", "Project setup and diagnostics", "In development"],
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
          Developer infrastructure for Robinhood Chain. This page is honest about what is
          implemented today; guides deepen as each module ships.
        </p>

        <div className="mt-6 rounded-card border border-line bg-surface-inset p-4 text-sm text-content-secondary">
          <strong className="text-content">Status.</strong> The network, error, registry,
          and design-token packages are implemented and tested. The API, authentication,
          and SDKs are in development. Every code sample below that references an
          implemented package runs as written; forthcoming APIs are labelled.
        </div>
      </div>

      <DocSection id="introduction" title="Introduction">
        <p>
          HoodStack is the developer infrastructure stack for Robinhood Chain: accounts,
          execution, gas, assets, connectivity, automation, security, and developer
          tooling, delivered through SDKs, a REST API, a CLI, and a dashboard.
        </p>
        <p>
          It is non-custodial by design — HoodStack cannot move user funds — and testnet
          is the default everywhere. See the{" "}
          <Link href="/products" className="text-content-brand hover:underline">
            product catalog
          </Link>{" "}
          for the full stack.
        </p>
      </DocSection>

      <DocSection id="installation" title="Installation">
        <p>Requires Node 20.11+ and pnpm 10+. Install the implemented packages:</p>
        <CodeBlock code={INSTALL} label="terminal" />
        <p className="text-sm text-content-tertiary">
          SDK packages (<code className="font-mono">@hoodstack/sdk</code>,{" "}
          <code className="font-mono">react</code>,{" "}
          <code className="font-mono">server</code>,{" "}
          <code className="font-mono">cli</code>) publish as they reach a stable
          interface.
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
        <p>
          Wrap your application in the provider once, then use the hooks and clients
          throughout. This API is forthcoming — the React SDK is in development:
        </p>
        <CodeBlock code={QUICKSTART} label="app/providers.tsx · forthcoming" />
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
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line">
          {PACKAGES.map(([name, desc, status]) => (
            <li
              key={name}
              className="flex flex-col gap-1 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <code className="font-mono text-sm text-content">{name}</code>
                <p className="text-xs text-content-tertiary">{desc}</p>
              </div>
              <span
                className={`shrink-0 font-mono text-xs ${
                  status === "Implemented"
                    ? "text-content-brand"
                    : "text-content-tertiary"
                }`}
              >
                {status}
              </span>
            </li>
          ))}
        </ul>
      </DocSection>
    </>
  );
}
