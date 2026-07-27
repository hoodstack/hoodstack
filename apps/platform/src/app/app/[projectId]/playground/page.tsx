import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { Playground } from "./_components/playground";

export const metadata: Metadata = { title: "Playground" };
export const dynamic = "force-dynamic";

/**
 * The Playground module: run the live read endpoints against testnet or mainnet
 * from the dashboard, and see the real response. Same logic the public API serves.
 */
export default async function PlaygroundPage({
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
        <p className="hs-mono-label mb-3">Playground</p>
        <h1 className="text-2xl font-semibold tracking-tight text-content">
          Run API calls
        </h1>
        <p className="mt-2 max-w-2xl text-content-secondary">
          Pick an endpoint, fill in the parameters, and run it live. These are the same
          reads the public API serves, metered to this project.
        </p>
      </div>

      <Playground projectId={project.id} />
    </div>
  );
}
