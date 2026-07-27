import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";
import { getUsageBreakdown } from "@/server/usage";

export const metadata: Metadata = { title: "Usage" };
export const dynamic = "force-dynamic";

/**
 * The Usage module: metered consumption for a project, from the same ledger every
 * gateway call writes. This is the raw meter the future credits model builds on.
 */
export default async function UsagePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const usage = await getUsageBreakdown(session.user.id, projectId);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="hs-mono-label mb-3">Usage</p>
        <h1 className="text-2xl font-semibold tracking-tight text-content">
          Metered consumption
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Tile label="Total requests" value={usage.total} />
        <Tile label="Last 7 days" value={usage.last7d} />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Breakdown title="By module" rows={usage.byModule} total={usage.total} />
        <Breakdown title="By action" rows={usage.byAction} total={usage.total} />
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <p className="text-xs text-content-tertiary">{label}</p>
      <p className="mt-2 hs-display text-3xl tabular-nums text-content">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { key: string; count: number }[];
  total: number;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <h2 className="hs-mono-label mb-4">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-content-tertiary">No usage yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
            return (
              <li key={row.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-content">{row.key}</span>
                  <span className="tabular-nums text-content-secondary">
                    {row.count.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-surface-inset">
                  <div
                    className="h-full rounded-pill bg-content-brand"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
