import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { CodeBlock, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Agents" };
export const dynamic = "force-dynamic";

const MCP_CONFIG = `{
  "mcpServers": {
    "hoodstack": {
      "command": "npx",
      "args": ["-y", "@hoodstack/agent-kit", "hoodstack-mcp"],
      "env": { "HOODSTACK_API_KEY": "hs_test_your_project_key" }
    }
  }
}`;

const TOOLKIT = `import { createHoodStackAgent } from "@hoodstack/agent-kit";

const agent = createHoodStackAgent({ apiKey: process.env.HOODSTACK_API_KEY! });
const gas = await agent.run("hoodstack_get_gas", {});`;

const TOOLS = [
  "hoodstack_health",
  "hoodstack_get_account",
  "hoodstack_get_transaction",
  "hoodstack_get_block",
  "hoodstack_get_token",
  "hoodstack_get_gas",
  "hoodstack_simulate_transaction",
  "hoodstack_rpc",
];

/**
 * The Agents module: connect an AI agent to this project through HoodStack.
 *
 * The agent kit (MCP server + toolkit) is live for reads and simulation using a
 * project API key. Autonomous agent accounts - smart accounts operated by
 * software with signed execution - are on the account-abstraction roadmap.
 */
export default async function AgentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <p className="hs-mono-label mb-3">Agents</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Connect an AI agent to this project.
          </h1>
        </div>
        <StatusBadge tone="success">Kit live</StatusBadge>
      </div>

      <p className="mb-8 max-w-2xl text-content-secondary">
        <code className="font-mono text-content">@hoodstack/agent-kit</code> gives an AI
        agent safe, typed access to Robinhood Chain through this project: read chain state,
        inspect tokens, and simulate transactions. Every tool is a read or a simulation, so
        an agent can plan and verify before anything is signed. Authenticate it with a{" "}
        <Link
          href={`/app/${project.id}/api-keys`}
          className="text-content-brand hover:underline"
        >
          project API key
        </Link>
        .
      </p>

      <section>
        <h2 className="hs-mono-label mb-3">As an MCP server</h2>
        <p className="mb-3 max-w-2xl text-sm text-content-secondary">
          Point any Model Context Protocol client (Claude Desktop, Claude Code) at the kit
          and set a key for this project.
        </p>
        <CodeBlock code={MCP_CONFIG} label="claude_desktop_config.json" />
      </section>

      <section className="mt-8">
        <h2 className="hs-mono-label mb-3">As a toolkit</h2>
        <p className="mb-3 max-w-2xl text-sm text-content-secondary">
          Or import the tools and wire them into your own agent framework.
        </p>
        <CodeBlock code={TOOLKIT} label="agent.ts" />
      </section>

      <section className="mt-10">
        <h2 className="hs-mono-label mb-4">Tools</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {TOOLS.map((name) => (
            <li
              key={name}
              className="rounded-control border border-line bg-surface px-3 py-2 font-mono text-xs text-content-secondary"
            >
              {name}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-card border border-line bg-surface-inset p-5">
        <h2 className="text-sm font-medium text-content">Autonomous agent accounts</h2>
        <p className="mt-2 max-w-2xl text-sm text-content-secondary">
          Smart accounts operated by software with signed execution, bounded by explicit
          budgets, allowlists, and expiry, are on the account-abstraction roadmap. The
          write path is proven on testnet and being wired in; a{" "}
          <code className="font-mono text-content">hoodstack_send_transaction</code> tool
          lands once it is live end to end. It stays non-custodial: the agent signs, the
          relayer only relays.
        </p>
      </section>

      <p className="mt-8 text-sm text-content-secondary">
        Read the overview on the{" "}
        <a
          href="/agents"
          target="_blank"
          rel="noreferrer noopener"
          className="text-content-brand hover:underline"
        >
          AI Agents page
        </a>
        .
      </p>
    </div>
  );
}
