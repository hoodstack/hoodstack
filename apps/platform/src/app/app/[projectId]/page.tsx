import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { listApiKeys } from "@/server/api-keys";
import { getProjectForMember } from "@/server/projects";

import { Wordmark } from "@/components/brand";
import { CodeBlock, Panel } from "@/components/ui";

import { AccountMenu } from "../_components/account-menu";
import { ApiKeysPanel, type KeyView } from "../_components/api-keys-panel";
import { SignedOut } from "../_components/signed-out";

export const metadata: Metadata = { title: "Project" };
export const dynamic = "force-dynamic";

/**
 * A project's overview: its keys, and how to call the gateway with them.
 *
 * `getProjectForMember` returns null for a project the caller doesn't belong to,
 * which we surface as a 404 — an unauthorized id is indistinguishable from a
 * nonexistent one, so nothing leaks about other orgs' projects.
 */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) return <SignedOut />;

  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const keys = await listApiKeys(session.user.id, projectId);
  const keyViews: KeyView[] = keys.map((key) => ({
    id: key.id,
    name: key.name,
    environment: key.environment,
    prefix: key.prefix,
    lastFour: key.lastFour,
    createdAt: key.createdAt.toISOString(),
    lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
    revokedAt: key.revokedAt ? key.revokedAt.toISOString() : null,
  }));

  const curl = [
    "curl https://www.hoodstack.io/api/v1/health \\",
    '  -H "Authorization: Bearer hs_test_your_key_here"',
  ].join("\n");

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-container items-center justify-between px-6">
          <Wordmark href="/" />
          <AccountMenu email={session.user.email} />
        </div>
      </header>

      <main id="main" className="mx-auto max-w-container px-6 py-16">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <Link
            href="/app/projects"
            className="text-content-tertiary transition-colors hover:text-content-brand"
          >
            ← Projects
          </Link>
        </nav>

        <h1 className="text-2xl font-semibold tracking-tight text-content">
          {project.name}
        </h1>
        <p className="mt-2 font-mono text-sm text-content-tertiary">{project.slug}</p>

        <section className="mt-10">
          <h2 className="text-md font-medium text-content">API keys</h2>
          <p className="mt-1 mb-5 max-w-2xl text-sm text-content-secondary">
            Authenticate gateway requests with a key. Test keys act against the
            Robinhood Chain testnet; live keys against mainnet.
          </p>
          <ApiKeysPanel projectId={project.id} keys={keyViews} />
        </section>

        <section className="mt-12">
          <h2 className="text-md font-medium text-content">Call the gateway</h2>
          <p className="mt-1 mb-4 max-w-2xl text-sm text-content-secondary">
            The health endpoint is the smallest authenticated call — it confirms your
            key resolves and reports which chain it acts against.
          </p>
          <Panel className="p-0">
            <CodeBlock code={curl} label="Test your key" />
          </Panel>
        </section>
      </main>
    </div>
  );
}
