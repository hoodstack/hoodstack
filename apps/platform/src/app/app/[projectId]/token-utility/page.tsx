import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getCreditSummary } from "@/server/credits";
import { getProjectForMember } from "@/server/projects";

import { StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Token Utility" };
export const dynamic = "force-dynamic";

const FUNDING = [
  {
    label: "Free-tier allocation",
    state: "Available",
    tone: "success" as const,
    body: "Every project starts with credits, no payment and no token.",
  },
  {
    label: "Conventional payment",
    state: "Roadmap",
    tone: "info" as const,
    body: "Fiat or stablecoin top-ups convert directly into credits.",
  },
  {
    label: "Verified token stake and token-funded credits",
    state: "After launch",
    tone: "neutral" as const,
    body: "A future token becomes one funding source that translates into the same credits.",
  },
];

const BOUNDARIES = [
  "Never required to create an account, sign in, recover access, or withdraw funds.",
  "Never a second, parallel system: capacity is always denominated in credits.",
  "Never gates the ability to leave: accounts and funds do not depend on it.",
];

/**
 * The Token Utility module: how a project's capacity is funded, and how a future
 * token would fit. Credits are the unit; the token is one funding source. No
 * token has launched and no contract is deployed, and the balance shown is real.
 */
export default async function TokenUtilityPage({
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

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <p className="hs-mono-label mb-3">Token Utility</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Credits are the unit. A token is one way to fund them.
          </h1>
        </div>
        <StatusBadge tone="warning">No token launched</StatusBadge>
      </div>

      <p className="mb-8 max-w-2xl text-content-secondary">
        Service capacity is denominated in usage credits, today and after any future
        token launch. A token would become an additional funding source that translates
        into the same credits; it never becomes a second, parallel system. No token has
        launched and no contract is deployed. The platform is fully usable without one.
      </p>

      {/* Real current capacity. */}
      <div className="rounded-card border border-line bg-surface p-6">
        <p className="text-xs text-content-tertiary">Current capacity (real)</p>
        <p className="mt-1 hs-display text-3xl tabular-nums text-content">
          {credits.balance.toLocaleString()} credits
        </p>
        <Link
          href={`/app/${project.id}/credits`}
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-content-brand hover:underline"
        >
          Open Credits
          <span aria-hidden="true">-&gt;</span>
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="hs-mono-label mb-4">Funding sources</h2>
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line">
          {FUNDING.map((item) => (
            <li key={item.label} className="bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-content">{item.label}</span>
                <StatusBadge tone={item.tone}>{item.state}</StatusBadge>
              </div>
              <p className="mt-1 text-sm text-content-secondary">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="hs-mono-label mb-4">What a token never does</h2>
        <ul className="space-y-2">
          {BOUNDARIES.map((line) => (
            <li key={line} className="flex gap-2 text-sm text-content-secondary">
              <span aria-hidden="true" className="text-content-tertiary">
                -
              </span>
              {line}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm text-content-secondary">
        Read the full capacity and token model on the{" "}
        <a
          href="/token-utility"
          target="_blank"
          rel="noreferrer noopener"
          className="text-content-brand hover:underline"
        >
          Token Utility page
        </a>
        .
      </p>
    </div>
  );
}
