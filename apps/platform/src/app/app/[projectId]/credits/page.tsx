import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getCreditSummary } from "@/server/credits";
import { getProjectForMember } from "@/server/projects";

export const metadata: Metadata = { title: "Credits" };
export const dynamic = "force-dynamic";

/**
 * The Credits module: a project's real usage-credit balance. Credits are an
 * offchain, non-transferable ledger; the balance is grants minus metered
 * consumption. No token is involved.
 */
export default async function CreditsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const credits = await getCreditSummary(session.user.id, projectId);
  const pctUsed =
    credits.granted > 0 ? Math.min(100, Math.round((credits.consumed / credits.granted) * 100)) : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="hs-mono-label mb-3">Credits</p>
        <h1 className="text-2xl font-semibold tracking-tight text-content">Usage credits</h1>
        <p className="mt-2 max-w-2xl text-content-secondary">
          Service capacity is denominated in credits. Your balance is grants minus
          metered usage, one credit per request. Credits are offchain and
          non-transferable, and no token is involved.
        </p>
      </div>

      <div className="rounded-card border border-line bg-surface p-6">
        <p className="text-xs text-content-tertiary">Balance</p>
        <p className="mt-1 hs-display text-4xl tabular-nums text-content">
          {credits.balance.toLocaleString()}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-pill bg-surface-inset">
          <div
            className="h-full rounded-pill bg-content-brand"
            style={{ width: `${pctUsed}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-content-secondary">
          <span>{credits.consumed.toLocaleString()} used</span>
          <span>{credits.granted.toLocaleString()} granted</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Tile label="Free-tier allocation" value={credits.freeTier.toLocaleString()} />
        <Tile
          label="Funding"
          text="Free tier now; conventional payment and token-funded top-ups on the roadmap"
        />
      </div>

      <section className="mt-10">
        <h2 className="hs-mono-label mb-4">Grants</h2>
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line">
          {credits.grants.map((grant) => (
            <li
              key={grant.id}
              className="flex items-center justify-between gap-3 bg-surface px-4 py-3"
            >
              <div>
                <span className="text-sm font-medium text-content">
                  {humanizeReason(grant.reason)}
                </span>
                <p className="text-xs text-content-tertiary">
                  {new Date(grant.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="font-mono text-sm tabular-nums text-content-brand">
                +{grant.amount.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-sm text-content-secondary">
        See how credits relate to the HSTACK token in{" "}
        <Link
          href={`/app/${project.id}/token-utility`}
          className="text-content-brand hover:underline"
        >
          Token Utility
        </Link>
        .
      </p>
    </div>
  );
}

function Tile({ label, value, text }: { label: string; value?: string; text?: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <p className="text-xs text-content-tertiary">{label}</p>
      {value ? (
        <p className="mt-2 hs-display text-2xl tabular-nums text-content">{value}</p>
      ) : (
        <p className="mt-2 text-sm text-content-secondary">{text}</p>
      )}
    </div>
  );
}

function humanizeReason(reason: string): string {
  if (reason === "free_tier") return "Free tier";
  return reason[0]!.toUpperCase() + reason.slice(1).replace(/_/g, " ");
}
