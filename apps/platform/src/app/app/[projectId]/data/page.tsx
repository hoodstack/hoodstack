import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { CodeBlock, Panel } from "@/components/ui";

import { DataConsole } from "./data-console";

export const metadata: Metadata = { title: "Data" };
export const dynamic = "force-dynamic";

/**
 * The Data module: read balances, accounts, and transactions from Robinhood
 * Chain. This is the first module wired to real infrastructure, the console
 * below and the public API share one read path in @hoodstack/network.
 */
export default async function DataPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const curl = [
    "curl 'https://www.hoodstack.io/api/v1/data/account?address=0x…' \\",
    '  -H "Authorization: Bearer hs_test_your_key_here"',
  ].join("\n");

  return (
    <div className="mx-auto max-w-4xl">
      <p className="hs-mono-label mb-3">Data</p>
      <h1 className="text-2xl font-semibold tracking-tight text-content">
        Read chain state
      </h1>
      <p className="mt-3 max-w-2xl text-content-secondary">
        Look up an account or transaction on Robinhood Chain. These are live
        raw-RPC reads, the same ones the Data API serves, metered against this
        project.
      </p>

      <section className="mt-8">
        <DataConsole projectId={project.id} />
      </section>

      <section className="mt-12">
        <h2 className="text-md font-medium text-content">From the API</h2>
        <p className="mt-1 mb-4 max-w-2xl text-sm text-content-secondary">
          The same reads are available at <code className="font-mono">/api/v1/data</code>{" "}
          with a project API key: <code className="font-mono">/account</code>,{" "}
          <code className="font-mono">/transaction</code>, and{" "}
          <code className="font-mono">/block</code>.
        </p>
        <Panel className="p-0">
          <CodeBlock code={curl} label="Account read" />
        </Panel>
      </section>
    </div>
  );
}
