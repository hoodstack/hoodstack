import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { CodeBlock, Panel } from "@/components/ui";

export const metadata: Metadata = { title: "API Reference" };
export const dynamic = "force-dynamic";

type Endpoint = {
  method: "GET" | "POST";
  path: string;
  summary: string;
  params?: string;
};

const GROUPS: { name: string; endpoints: Endpoint[] }[] = [
  {
    name: "Core",
    endpoints: [
      { method: "GET", path: "/api/v1/health", summary: "Verify a key and report its chain." },
      {
        method: "POST",
        path: "/api/v1/rpc",
        summary: "Read-only JSON-RPC proxy. Idempotent methods only.",
        params: "{ method: string, params?: unknown[] }",
      },
    ],
  },
  {
    name: "Data",
    endpoints: [
      { method: "GET", path: "/api/v1/data/account", summary: "Balance, nonce, and contract detection.", params: "?address=0x…" },
      { method: "GET", path: "/api/v1/data/transaction", summary: "A transaction with its receipt.", params: "?hash=0x…" },
      { method: "GET", path: "/api/v1/data/block", summary: "A block header.", params: "?number=latest" },
      { method: "GET", path: "/api/v1/data/token", summary: "ERC-20 metadata and holder balance.", params: "?address=0x…&holder=0x…" },
    ],
  },
  {
    name: "Gas",
    endpoints: [{ method: "GET", path: "/api/v1/gas", summary: "Gas price, base fee, and a transfer cost." }],
  },
  {
    name: "Transactions",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/tx/simulate",
        summary: "Simulate a call and estimate gas. Nothing is submitted.",
        params: "{ to: string, from?, valueWei?, data? }",
      },
    ],
  },
];

/**
 * The API Reference module: the live `/api/v1` surface, grouped. Every endpoint
 * here is real and authenticated by a project API key.
 */
export default async function ApiReferencePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const example = [
    "curl 'https://www.hoodstack.io/api/v1/data/account?address=0x…' \\",
    '  -H "Authorization: Bearer hs_test_your_key"',
  ].join("\n");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="hs-mono-label mb-3">API Reference</p>
        <h1 className="text-2xl font-semibold tracking-tight text-content">
          The v1 API
        </h1>
        <p className="mt-2 max-w-2xl text-content-secondary">
          Authenticate with a project API key as a bearer token. Responses share one
          envelope: <code className="font-mono">{"{ ok, requestId, data }"}</code> on
          success, <code className="font-mono">{"{ ok: false, error }"}</code> with a
          stable <code className="font-mono">HS_</code> code on failure. Every call is
          rate limited and metered.
        </p>
      </div>

      <Panel className="mb-8 p-0">
        <CodeBlock code={example} label="Example" />
      </Panel>

      <div className="flex flex-col gap-8">
        {GROUPS.map((group) => (
          <section key={group.name}>
            <h2 className="hs-mono-label mb-3">{group.name}</h2>
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line">
              {group.endpoints.map((endpoint) => (
                <li key={endpoint.path} className="bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        endpoint.method === "GET"
                          ? "rounded-control bg-status-info-bg px-2 py-0.5 font-mono text-xs text-status-info"
                          : "rounded-control bg-status-warning-bg px-2 py-0.5 font-mono text-xs text-status-warning"
                      }
                    >
                      {endpoint.method}
                    </span>
                    <code className="font-mono text-sm text-content">{endpoint.path}</code>
                    {endpoint.params ? (
                      <code className="font-mono text-xs text-content-tertiary">
                        {endpoint.params}
                      </code>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-content-secondary">{endpoint.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
