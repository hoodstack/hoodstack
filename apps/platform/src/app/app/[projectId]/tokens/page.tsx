import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { CodeBlock, Panel, StatusBadge } from "@/components/ui";

import { TokenInspector } from "./_components/token-inspector";

export const metadata: Metadata = { title: "Tokens" };
export const dynamic = "force-dynamic";

/**
 * The Tokens module: a live ERC-20 inspector. Transfers and approvals, which
 * require signing, land with the account-abstraction provider.
 */
export default async function TokensPage({
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
    "curl 'https://www.hoodstack.io/api/v1/data/token?address=0x…' \\",
    '  -H "Authorization: Bearer hs_test_your_key"',
  ].join("\n");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <p className="hs-mono-label mb-3">Tokens</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Token inspector
          </h1>
        </div>
        <StatusBadge tone="info">Transfers on the roadmap</StatusBadge>
      </div>

      <TokenInspector projectId={project.id} />

      <p className="mt-6 text-sm text-content-secondary">
        Curating the tokens your app uses? Save them in the{" "}
        <Link
          href={`/app/${project.id}/registry`}
          className="text-content-brand hover:underline"
        >
          Asset Registry
        </Link>
        .
      </p>

      <section className="mt-12">
        <h2 className="text-md font-medium text-content">From the API</h2>
        <p className="mt-1 mb-4 max-w-2xl text-sm text-content-secondary">
          The same read is available with a project API key.
        </p>
        <Panel className="p-0">
          <CodeBlock code={curl} label="Token read" />
        </Panel>
      </section>
    </div>
  );
}
