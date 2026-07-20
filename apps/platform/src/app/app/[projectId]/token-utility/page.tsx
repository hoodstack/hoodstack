import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink, Panel, StatusBadge } from "@/components/ui";

/**
 * In-app token utility view (pre-launch).
 *
 * A dedicated page that overrides the generic module preview, because token
 * utility is central to the platform. It shows the *structure* of what will
 * appear — capacity, credits, usage, entitlements — with honest empty states,
 * never a fabricated number. No token has launched, and nothing here implies one
 * has. When metering and the entitlement adapter ship, these panels fill with
 * real data at this same URL.
 *
 * The parent [projectId] is unknowable at build time, so this renders on demand.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Token utility" };

const METRICS = [
  { label: "Credit balance", note: "Ledger activates with billing" },
  { label: "API requests", note: "Metering activates when the API ships" },
  { label: "Sponsored gas", note: "Recorded once sponsorship is live" },
  { label: "Webhook deliveries", note: "Recorded once webhooks are live" },
];

export default async function AppTokenUtilityPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h1 className="hs-display text-2xl text-content lg:text-3xl">Token utility</h1>
          <StatusBadge tone="pending">Pre-launch</StatusBadge>
        </div>
        <p className="max-w-2xl text-content-secondary">
          Capacity for this project is denominated in usage credits. A future token
          becomes an additional way to fund credits — never a requirement to use the
          platform, and never a requirement to touch your funds.
        </p>
      </div>

      {/* Honest state banner. */}
      <Panel className="border-line bg-status-warning-bg p-5">
        <p className="hs-mono-label" style={{ color: "var(--hs-status-warning)" }}>
          No token launched
        </p>
        <p className="mt-3 text-sm text-content-secondary">
          No token contract has been deployed, and nothing on this page is an offer. This
          view shows the structure your capacity will use. It reports no fabricated
          balance, stake, APR, reward, or governance proposal — only real data, once there
          is real data to report.
        </p>
      </Panel>

      {/* Capacity metrics — structure with honest empty states. */}
      <section className="mt-8">
        <h2 className="hs-mono-label mb-4">Capacity</h2>
        <div className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric) => (
            <div key={metric.label} className="bg-surface p-5">
              <p className="text-sm text-content-tertiary">{metric.label}</p>
              {/* Deliberately a dash, not a zero — there is no metering yet, and a
                  fabricated "0" would imply a connected, empty counter. */}
              <p className="hs-display mt-2 text-3xl text-content-tertiary">—</p>
              <p className="mt-2 text-xs text-content-tertiary">{metric.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Credit ledger empty state. */}
      <section className="mt-8">
        <h2 className="hs-mono-label mb-4">Credit ledger</h2>
        <Panel className="p-8 text-center">
          <p className="text-sm font-medium text-content">No credit entries yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-content-secondary">
            The credit ledger is an append-only record of capacity granted and consumed.
            It begins recording when billing and metering are enabled for this project.
          </p>
        </Panel>
      </section>

      {/* Entitlement architecture. */}
      <section className="mt-8">
        <h2 className="hs-mono-label mb-4">How capacity will be funded</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="p-6">
            <h3 className="text-sm font-medium text-content">Today</h3>
            <p className="mt-3 text-sm text-content-secondary">
              Credits are funded by free allocation and conventional fiat or stablecoin
              payment. No token is involved, and none is required.
            </p>
          </Panel>
          <Panel className="p-6">
            <h3 className="text-sm font-medium text-content">After launch</h3>
            <p className="mt-3 text-sm text-content-secondary">
              An entitlement adapter translates verified token stake, token-funded
              credits, and operator bonds into the same credits — reconciled only against
              finalized chain state. This URL deepens in place; token accounting stays
              separate from authentication, wallet ownership, recovery, and your balances.
            </p>
          </Panel>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/products/token-utility" variant="secondary">
          Token utility architecture
        </ButtonLink>
        <Link
          href={`/app/${encodeURIComponent(projectId)}/usage`}
          className="inline-flex items-center gap-1.5 self-center text-sm text-content-brand hover:underline"
        >
          Project usage
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
