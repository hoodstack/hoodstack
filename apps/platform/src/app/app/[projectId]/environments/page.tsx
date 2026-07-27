import { getFaucetUrl, robinhood, robinhoodTestnet } from "@hoodstack/network";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Environments" };
export const dynamic = "force-dynamic";

/**
 * The Environments module: the two networks a project can act against, and how a
 * key's environment selects between them. Read-only reference.
 */
export default async function EnvironmentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const rows = [
    { env: "Test", chain: robinhoodTestnet, tone: "info" as const },
    { env: "Live", chain: robinhood, tone: "warning" as const },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="hs-mono-label mb-3">Environments</p>
        <h1 className="text-2xl font-semibold tracking-tight text-content">
          Testnet and mainnet
        </h1>
        <p className="mt-2 max-w-2xl text-content-secondary">
          Every API key belongs to an environment. A <strong>test</strong> key acts
          against Robinhood Chain testnet; a <strong>live</strong> key against mainnet.
          The gateway routes each request by the key that made it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map(({ env, chain, tone }) => (
          <div key={env} className="rounded-card border border-line bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <StatusBadge tone={tone}>{env}</StatusBadge>
              <span className="text-sm font-medium text-content">{chain.name}</span>
            </div>
            <dl className="space-y-2 text-sm">
              <Row term="Chain ID" value={String(chain.id)} />
              <Row term="Native currency" value={chain.nativeCurrency.symbol} />
              <Row term="Key prefix" value={`hs_${env.toLowerCase()}_…`} />
              <Row term="RPC" value={chain.rpcUrls.default.http[0] ?? "-"} mono />
              <Row
                term="Explorer"
                value={chain.blockExplorers?.default.url ?? "-"}
                mono
              />
              {chain.isTestnet ? (
                <Row term="Faucet" value={getFaucetUrl(chain) ?? "-"} mono />
              ) : null}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ term, value, mono }: { term: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line pb-2 last:border-0 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-content-tertiary">{term}</dt>
      <dd
        className={
          mono
            ? "break-all text-right font-mono text-xs text-content"
            : "text-right text-content"
        }
      >
        {value}
      </dd>
    </div>
  );
}
