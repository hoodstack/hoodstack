import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { ExplorerSearch } from "./_components/explorer-search";

export const metadata: Metadata = { title: "Explorer" };
export const dynamic = "force-dynamic";

/**
 * The Explorer module: one search box over accounts, transactions, and blocks,
 * with Blockscout deep links. It complements Blockscout rather than replacing
 * it; smart-account and user-operation context lands with account abstraction.
 */
export default async function ExplorerPage({
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
      <div className="mb-8">
        <p className="hs-mono-label mb-3">Explorer</p>
        <h1 className="text-2xl font-semibold tracking-tight text-content">
          Explore the chain
        </h1>
        <p className="mt-2 max-w-2xl text-content-secondary">
          Paste an address, transaction hash, or block number. HoodStack reads it live
          and links out to Blockscout for the full record.
        </p>
      </div>

      <ExplorerSearch projectId={project.id} />
    </div>
  );
}
