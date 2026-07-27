import type { Metadata } from "next";
import Link from "next/link";

import { getSessionUser } from "@/lib/auth/session";
import { listProjects } from "@/server/projects";

import { Wordmark } from "@/components/brand";
import { Panel } from "@/components/ui";

import { AccountMenu } from "../_components/account-menu";
import { CreateProjectForm } from "../_components/create-project-form";
import { SignedOut } from "../_components/signed-out";

export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

/**
 * The project list — the dashboard's home.
 *
 * The session is resolved from the request cookie server-side. No session means
 * render the signed-out gate; a session means the user (and their default org)
 * has been provisioned, so we can list and create projects against it.
 */
export default async function ProjectsPage() {
  const session = await getSessionUser();
  if (!session) return <SignedOut />;

  const projects = await listProjects(session.user.id, session.defaultOrg.id);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-container items-center justify-between px-6">
          <Wordmark href="/" />
          <AccountMenu email={session.user.email} />
        </div>
      </header>

      <main id="main" className="mx-auto max-w-container px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-content">Projects</h1>
        <p className="mt-2 text-content-secondary">{session.defaultOrg.name}</p>

        <Panel className="mt-8 p-6">
          <h2 className="text-md font-medium text-content">New project</h2>
          <p className="mt-1 mb-4 max-w-xl text-sm text-content-secondary">
            A project isolates its own API keys, environment, and usage.
          </p>
          <CreateProjectForm />
        </Panel>

        {projects.length === 0 ? (
          <p className="mt-8 text-sm text-content-secondary">
            No projects yet. Create your first one above.
          </p>
        ) : (
          <ul className="mt-8 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <li key={project.id} className="bg-surface">
                <Link
                  href={`/app/${project.id}`}
                  className="group flex h-full flex-col gap-2 p-6 transition-colors duration-fast hover:bg-surface-raised"
                >
                  <span className="text-md font-medium text-content group-hover:text-content-brand">
                    {project.name}
                  </span>
                  <span className="font-mono text-xs text-content-tertiary">
                    {project.slug}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
