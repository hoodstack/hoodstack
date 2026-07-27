import { DEFAULT_CHAIN } from "@hoodstack/network";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { listApiKeys } from "@/server/api-keys";
import { getProjectForMember } from "@/server/projects";
import { getProjectUsageSummary } from "@/server/usage";

import { StatusBadge } from "@/components/ui";

import { NetworkStatusCard } from "./_components/network-status-card";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/**
 * Project home.
 *
 * A live overview: real network status, real key and usage counts, and a
 * quickstart that reflects the project's actual state. Server-rendered stats
 * appear instantly; the network card streams its own loading, success, and
 * failure states from a live chain read.
 */
export default async function OverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const [keys, usage] = await Promise.all([
    listApiKeys(session.user.id, projectId),
    getProjectUsageSummary(session.user.id, projectId),
  ]);

  const activeKeys = keys.filter((k) => k.revokedAt === null);
  const environment = DEFAULT_CHAIN.isTestnet ? "test" : "live";

  const steps = [
    { label: "Create a project", done: true, href: null },
    {
      label: "Create an API key",
      done: activeKeys.length > 0,
      href: `/app/${project.id}/api-keys`,
    },
    {
      label: "Make your first read",
      done: usage.total > 0,
      href: `/app/${project.id}/data`,
    },
  ];
  const remaining = steps.filter((s) => !s.done).length;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero band. */}
      <div className="relative overflow-hidden rounded-card border border-line bg-surface-inset p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="hs-grid-field pointer-events-none absolute inset-0 opacity-40"
        />
        <div className="relative">
          <p className="hs-mono-label mb-3">Project</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="hs-display text-3xl text-content sm:text-4xl">
              {project.name}
            </h1>
            <StatusBadge tone={DEFAULT_CHAIN.isTestnet ? "info" : "warning"}>
              {DEFAULT_CHAIN.name}
            </StatusBadge>
          </div>
          <p className="mt-2 font-mono text-sm text-content-tertiary">{project.slug}</p>
        </div>
      </div>

      {/* Stat tiles. */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile
          label="Active API keys"
          value={activeKeys.length}
          href={`/app/${project.id}/api-keys`}
        />
        <StatTile label="Total requests" value={usage.total} href={`/app/${project.id}/data`} />
        <StatTile
          label="Last activity"
          text={usage.lastAt ? relativeDay(usage.lastAt) : "None yet"}
        />
      </div>

      {/* Live network + quickstart. */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <NetworkStatusCard
          projectId={project.id}
          environment={environment}
          isTestnet={DEFAULT_CHAIN.isTestnet}
        />

        <div className="rounded-card border border-line bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="hs-mono-label">Quickstart</h2>
            <span className="text-xs text-content-tertiary">
              {remaining === 0 ? "Complete" : `${remaining} left`}
            </span>
          </div>
          <ol className="mt-5 space-y-3">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center gap-3">
                <Check done={step.done} />
                {step.href && !step.done ? (
                  <Link
                    href={step.href}
                    className="text-sm text-content transition-colors hover:text-content-brand"
                  >
                    {step.label}
                  </Link>
                ) : (
                  <span
                    className={
                      step.done
                        ? "text-sm text-content-tertiary line-through"
                        : "text-sm text-content"
                    }
                  >
                    {step.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-sm text-content-secondary">
              Data is live. Read balances, accounts, and transactions from Robinhood
              Chain.
            </p>
            <Link
              href={`/app/${project.id}/data`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-content-brand hover:underline"
            >
              Open Data
              <span aria-hidden="true">-&gt;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  text,
  href,
}: {
  label: string;
  value?: number;
  text?: string;
  href?: string;
}) {
  const body = (
    <div className="h-full rounded-card border border-line bg-surface p-5 transition-colors duration-fast hover:border-line-strong">
      <p className="text-xs text-content-tertiary">{label}</p>
      <p className="mt-2 hs-display text-3xl tabular-nums text-content">
        {text ?? value?.toLocaleString()}
      </p>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

function Check({ done }: { done: boolean }) {
  return (
    <span
      className={
        done
          ? "flex size-5 shrink-0 items-center justify-center rounded-full bg-content-brand text-brand-on"
          : "flex size-5 shrink-0 items-center justify-center rounded-full border border-line-strong"
      }
      aria-hidden="true"
    >
      {done ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12l5 5L20 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

function relativeDay(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
