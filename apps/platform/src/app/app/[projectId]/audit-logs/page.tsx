import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { listAuditLog } from "@/server/audit";
import { getProjectForMember } from "@/server/projects";

import { TimeAgo } from "@/components/time-ago";

export const metadata: Metadata = { title: "Audit Logs" };
export const dynamic = "force-dynamic";

/**
 * The Audit Logs module: an append-only record of privileged actions in the
 * project, keys, policies, webhooks, assets, accounts, and the project itself.
 * Written best-effort alongside each mutation.
 */
export default async function AuditLogsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const entries = await listAuditLog(session.user.id, projectId, 100);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="hs-mono-label mb-3">Audit Logs</p>
        <h1 className="text-2xl font-semibold tracking-tight text-content">
          Privileged actions
        </h1>
        <p className="mt-2 max-w-2xl text-content-secondary">
          An append-only record of changes to keys, policies, webhooks, assets, and
          the project. Newest first.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center">
          <p className="text-sm font-medium text-content">No audit entries yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-content-secondary">
            Create a key, set a policy, or add a webhook, and the action is recorded
            here with who did it and when.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-card border border-line">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 last:border-0"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded-control bg-surface-inset px-2 py-0.5 font-mono text-xs text-content">
                    {entry.action}
                  </code>
                  {entry.target ? (
                    <span className="truncate font-mono text-xs text-content-tertiary">
                      {entry.target}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5 text-right text-xs text-content-tertiary">
                <TimeAgo iso={entry.createdAt} fallback={shortTime(entry.createdAt)} />
                <span>{entry.actorEmail ?? "system"}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function shortTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
