import { getExplorerTokenUrl, robinhood } from "@hoodstack/network";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { HSTACK } from "@/lib/hstack";
import { getCreditSummary } from "@/server/credits";
import { readHstack } from "@/server/hstack";
import { getProjectForMember } from "@/server/projects";
import { getProjectUsageSummary } from "@/server/usage";

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
    state: "In development",
    tone: "neutral" as const,
    body: "The HSTACK token is live on Robinhood Chain; the entitlement adapter that translates stake into credits is being built.",
  },
];

const BOUNDARIES = [
  "Never required to create an account, sign in, recover access, or withdraw funds.",
  "Never a second, parallel system: capacity is always denominated in credits.",
  "Never gates the ability to leave: accounts and funds do not depend on it.",
];

/** Group the integer part with thousands separators, preserving any fraction. */
function withGroups(value: string): string {
  const [int, frac] = value.split(".");
  const grouped = (int ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac ? `${grouped}.${frac}` : grouped;
}

/**
 * The Token Utility module: how a project's capacity is funded, and how the
 * token fits. Credits are the unit; the token is one funding source. The HSTACK
 * token is live on Robinhood Chain; the capacity flow below is wired to the
 * project's real credit balance and metered usage, and capacity does not depend
 * on the token.
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

  const [credits, usage, token] = await Promise.all([
    getCreditSummary(session.user.id, projectId),
    getProjectUsageSummary(session.user.id, projectId),
    readHstack(),
  ]);

  const symbol = token?.symbol ?? HSTACK.symbol;
  const decimals = token?.decimals ?? HSTACK.decimals;
  const supply = token?.totalSupplyFormatted ?? null;
  const explorerUrl = getExplorerTokenUrl(robinhood, HSTACK.address);

  // The capacity abstraction, wired to this project's real numbers.
  const flow = [
    {
      step: "Fund",
      metric: `${credits.freeTier.toLocaleString()} free`,
      body: "Free allocation today; conventional payment and token-funded credits add grants without changing the model.",
    },
    {
      step: "Credits",
      metric: `${credits.balance.toLocaleString()} left`,
      body: `${credits.consumed.toLocaleString()} of ${credits.granted.toLocaleString()} used. Non-transferable, offchain, one credit per request.`,
    },
    {
      step: "Capacity",
      metric: `${usage.total.toLocaleString()} calls`,
      body: "API throughput, data, simulation, and account operations, what the credits buy.",
    },
    {
      step: "Infrastructure",
      metric: "Robinhood Chain",
      body: "What your app runs on. The token coordinates access; it is never the thing itself.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <p className="hs-mono-label mb-3">Token Utility</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Credits are the unit. A token is one way to fund them.
          </h1>
        </div>
        <StatusBadge tone="success">HSTACK live on mainnet</StatusBadge>
      </div>

      <p className="mb-8 max-w-2xl text-content-secondary">
        Service capacity is denominated in usage credits, whether or not the token funds
        them. The token is an additional funding source that translates into the same
        credits; it never becomes a second, parallel system. The HSTACK token is live on
        Robinhood Chain, and the platform is fully usable without it.
      </p>

      {/* Live token, read from the chain. */}
      <div className="rounded-card border border-[var(--hs-border-brand-strong)] bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="hs-mono-label flex items-center gap-2 text-content-brand">
            <span
              aria-hidden="true"
              className="inline-block size-1.5 rounded-pill bg-brand"
            />
            {symbol} live on Robinhood Chain
          </p>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-content-brand hover:underline"
          >
            Blockscout ↗
          </a>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <TokenFact label="Token" value={symbol} />
          <TokenFact label="Total supply" value={supply ? withGroups(supply) : "—"} />
          <TokenFact label="Decimals" value={String(decimals)} />
          <TokenFact label="Network" value={`Mainnet · ${HSTACK.chainId}`} />
        </dl>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 block break-all font-mono text-xs text-content-tertiary transition-colors hover:text-content-brand"
        >
          {HSTACK.address}
        </a>
      </div>

      {/* The capacity flow, with this project's real values. */}
      <section className="mt-10">
        <h2 className="hs-mono-label mb-4">How capacity works here</h2>
        <ol className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {flow.map((item, index) => (
            <li key={item.step} className="bg-surface p-5">
              <div className="flex items-center gap-2">
                <span className="hs-tick tabular-nums text-content-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-sm font-medium text-content">{item.step}</h3>
                {index < flow.length - 1 ? (
                  <span aria-hidden="true" className="ml-auto text-content-tertiary">
                    →
                  </span>
                ) : null}
              </div>
              <p className="mt-3 hs-display text-xl tabular-nums text-content">
                {item.metric}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-content-secondary">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
        <Link
          href={`/app/${project.id}/credits`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-content-brand hover:underline"
        >
          Open Credits
          <span aria-hidden="true">-&gt;</span>
        </Link>
      </section>

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

function TokenFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-content-tertiary">{label}</dt>
      <dd className="mt-1 font-mono text-sm text-content">{value}</dd>
    </div>
  );
}
