import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { CodeBlock, Panel, StatusBadge } from "@/components/ui";

import { TransactionsConsole } from "./_components/transactions-console";

export const metadata: Metadata = { title: "Transactions" };
export const dynamic = "force-dynamic";

/**
 * The Transactions module: simulate a call (with a policy check) or track a
 * transaction. Signed submission and sponsored execution land with the
 * account-abstraction provider.
 */
export default async function TransactionsPage({
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
    "curl -X POST https://www.hoodstack.io/api/v1/tx/simulate \\",
    '  -H "Authorization: Bearer hs_test_your_key" \\',
    '  -H "content-type: application/json" \\',
    '  -d \'{"to":"0x…","valueWei":"1000000000000000"}\'',
  ].join("\n");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <p className="hs-mono-label mb-3">Transactions</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Simulate and track
          </h1>
        </div>
        <StatusBadge tone="info">Signed submission on the roadmap</StatusBadge>
      </div>

      <TransactionsConsole projectId={project.id} />

      <section className="mt-12">
        <h2 className="text-md font-medium text-content">From the API</h2>
        <p className="mt-1 mb-4 max-w-2xl text-sm text-content-secondary">
          Simulate with a project API key. Read-only, nothing is submitted.
        </p>
        <Panel className="p-0">
          <CodeBlock code={curl} label="Simulate" />
        </Panel>
      </section>
    </div>
  );
}
