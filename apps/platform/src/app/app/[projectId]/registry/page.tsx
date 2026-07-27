import { getChainById } from "@hoodstack/network";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { listAssets } from "@/server/assets";
import { getProjectForMember } from "@/server/projects";

import { StatusBadge } from "@/components/ui";

import { AssetsManager, type AssetView } from "./_components/assets-manager";

export const metadata: Metadata = { title: "Asset Registry" };
export const dynamic = "force-dynamic";

/**
 * The Asset Registry module: verified ERC-20 entries, keyed by chain and
 * contract address, with metadata read from chain and a recorded source.
 * Cross-project canonical verification lands later.
 */
export default async function RegistryPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const assets = await listAssets(session.user.id, projectId);
  const views: AssetView[] = assets.map((asset) => {
    const chain = getChainById(asset.chainId);
    return {
      id: asset.id,
      address: asset.address,
      symbol: asset.symbol,
      name: asset.name,
      decimals: asset.decimals,
      source: asset.source,
      network: chain ? (chain.isTestnet ? "Testnet" : "Mainnet") : `Chain ${asset.chainId}`,
    };
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <p className="hs-mono-label mb-3">Asset Registry</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Verified assets
          </h1>
        </div>
        <StatusBadge tone="info">Canonical verification on the roadmap</StatusBadge>
      </div>

      <AssetsManager projectId={project.id} assets={views} />
    </div>
  );
}
