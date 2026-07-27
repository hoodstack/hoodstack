import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { CodeBlock, Panel, StatusBadge } from "@/components/ui";

import { GasTracker } from "./_components/gas-tracker";

export const metadata: Metadata = { title: "Gas" };
export const dynamic = "force-dynamic";

/**
 * The Gas module: a live gas tracker for Robinhood Chain. Gas sponsorship and
 * paymaster policies land with the account-abstraction provider.
 */
export default async function GasPage({
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
    "curl https://www.hoodstack.io/api/v1/gas \\",
    '  -H "Authorization: Bearer hs_test_your_key"',
  ].join("\n");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <p className="hs-mono-label mb-3">Gas</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Gas tracker
          </h1>
        </div>
        <StatusBadge tone="info">Sponsorship on the roadmap</StatusBadge>
      </div>

      <GasTracker projectId={project.id} />

      <section className="mt-12">
        <h2 className="text-md font-medium text-content">From the API</h2>
        <p className="mt-1 mb-4 max-w-2xl text-sm text-content-secondary">
          The same reading is available with a project API key.
        </p>
        <Panel className="p-0">
          <CodeBlock code={curl} label="Gas read" />
        </Panel>
      </section>
    </div>
  );
}
