import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";
import { getProjectUsageSummary, getRecentActivity, type ActivityEvent } from "@/server/usage";

import { StatusBadge } from "@/components/ui";
import { TimeAgo } from "@/components/time-ago";

import { RefreshButton } from "./_components/refresh-button";

export const metadata: Metadata = { title: "Activity" };
export const dynamic = "force-dynamic";

/**
 * The project activity feed.
 *
 * A chronological record of what the project did, drawn from the real usage
 * ledger every gateway call writes. As more modules ship, they record their own
 * events and this timeline enriches; today it is API and read activity.
 */
export default async function ActivityPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const [events, usage] = await Promise.all([
    getRecentActivity(session.user.id, projectId, 100),
    getProjectUsageSummary(session.user.id, projectId),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="hs-mono-label mb-3">Activity</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Recent activity
          </h1>
          <p className="mt-2 text-content-secondary">
            {usage.total > 0
              ? `${usage.total.toLocaleString()} total ${usage.total === 1 ? "request" : "requests"}.`
              : "Every authenticated request to this project appears here."}
          </p>
        </div>
        <RefreshButton />
      </div>

      <div className="mt-8">
        {events.length === 0 ? (
          <EmptyState projectId={project.id} />
        ) : (
          <ul className="overflow-hidden rounded-card border border-line">
            {events.map((event) => (
              <ActivityRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  health: "Health check",
  rpc: "RPC call",
  account: "Account read",
  transaction: "Transaction read",
  block: "Block read",
};

function ActivityRow({ event }: { event: ActivityEvent }) {
  const label = ACTION_LABELS[event.action] ?? capitalize(event.action);
  const detail = detailFor(event);
  const failed = event.status !== "ok";
  const source = event.keyName ?? "Dashboard";

  return (
    <li className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 last:border-0">
      <span
        aria-hidden="true"
        className={
          failed
            ? "size-2 shrink-0 rounded-full bg-status-danger"
            : "size-2 shrink-0 rounded-full bg-content-brand"
        }
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-content">{label}</span>
          {failed ? <StatusBadge tone="danger">failed</StatusBadge> : null}
        </div>
        {detail ? (
          <p className="truncate font-mono text-xs text-content-tertiary">{detail}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
        <span className="text-xs text-content-tertiary">
          <TimeAgo iso={event.createdAt} fallback={shortTime(event.createdAt)} />
        </span>
        <span className="text-xs text-content-tertiary">{source}</span>
      </div>
    </li>
  );
}

function EmptyState({ projectId }: { projectId: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-10 text-center">
      <p className="text-sm font-medium text-content">No activity yet</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-content-secondary">
        Make your first read from Robinhood Chain and it will show up here, with the
        key that made it and how long ago.
      </p>
      <Link
        href={`/app/${projectId}/data`}
        className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-content-brand hover:underline"
      >
        Open Data
        <span aria-hidden="true">-&gt;</span>
      </Link>
    </div>
  );
}

function detailFor(event: ActivityEvent): string | null {
  const meta = event.meta;
  if (!meta) return null;
  if (typeof meta["method"] === "string") return meta["method"];
  if (typeof meta["address"] === "string") return meta["address"];
  if (typeof meta["hash"] === "string") return meta["hash"];
  if (typeof meta["number"] === "number") return `block #${meta["number"]}`;
  return null;
}

function capitalize(value: string): string {
  return value.length > 0 ? value[0]!.toUpperCase() + value.slice(1) : value;
}

function shortTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
