import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { SettingsForm } from "./_components/settings-form";

export const metadata: Metadata = { title: "Project Settings" };
export const dynamic = "force-dynamic";

/** The Project Settings module: rename and delete a project. */
export default async function SettingsPage({
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
        <p className="hs-mono-label mb-3">Project Settings</p>
        <h1 className="text-2xl font-semibold tracking-tight text-content">Settings</h1>
      </div>

      <SettingsForm
        projectId={project.id}
        projectName={project.name}
        projectSlug={project.slug}
      />
    </div>
  );
}
