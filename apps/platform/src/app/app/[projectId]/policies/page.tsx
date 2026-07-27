import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getPolicy } from "@/server/policies";
import { getProjectForMember } from "@/server/projects";

import { StatusBadge } from "@/components/ui";

import { PolicyEditor } from "./_components/policy-editor";

export const metadata: Metadata = { title: "Policies" };
export const dynamic = "force-dynamic";

/**
 * The Policies module: a spending ceiling and recipient allowlist, evaluated
 * live against every transaction simulation. Enforcement at submit lands with
 * signed execution.
 */
export default async function PoliciesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const policy = await getPolicy(session.user.id, projectId);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <p className="hs-mono-label mb-3">Policies</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Execution policy
          </h1>
        </div>
        <StatusBadge tone="info">Enforced at submit on the roadmap</StatusBadge>
      </div>

      <p className="mb-6 max-w-2xl text-content-secondary">
        Set spending and recipient rules, then see them evaluated live when you{" "}
        <Link
          href={`/app/${project.id}/transactions`}
          className="text-content-brand hover:underline"
        >
          simulate a transaction
        </Link>
        .
      </p>

      <PolicyEditor projectId={project.id} policy={policy} />
    </div>
  );
}
