import "server-only";

import { and, asc, eq, getDb, projectAssets, type ProjectAsset } from "@hoodstack/db";
import { readToken } from "@hoodstack/network";

import type { KeyEnvironment } from "@/lib/api-keys";
import { recordAudit } from "./audit";
import { chainForEnvironment, rpcUrlsForEnvironment } from "./chain";
import { getProjectForMember } from "./projects";
import { recordUsage } from "./usage";

/**
 * The project asset registry.
 *
 * Verified ERC-20 entries, keyed by chain ID and contract address, never by
 * ticker. Adding an asset reads its metadata from chain so the registry records
 * what the contract actually is, alongside the source the developer supplies.
 */

export async function listAssets(
  userId: string,
  projectId: string,
): Promise<ProjectAsset[]> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) return [];
  return getDb()
    .select()
    .from(projectAssets)
    .where(eq(projectAssets.projectId, projectId))
    .orderBy(asc(projectAssets.createdAt));
}

/**
 * Register an asset. Reads and verifies the ERC-20 metadata on the given
 * network, then stores it with the source. Idempotent per (project, chain,
 * address).
 */
export async function addAsset(
  userId: string,
  projectId: string,
  environment: KeyEnvironment,
  address: string,
  source: string,
): Promise<ProjectAsset> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) throw new Error("Project not found.");

  const trimmedSource = source.trim();
  if (!trimmedSource) throw new Error("A source is required for every entry.");

  const chain = chainForEnvironment(environment);
  const token = await readToken(
    rpcUrlsForEnvironment(environment),
    chain,
    address.trim(),
    undefined,
    { timeoutMs: 10_000 },
  );

  await recordUsage({
    projectId: project.id,
    module: "registry",
    action: "verify",
    meta: { address: token.address, chainId: chain.id },
  }).catch(() => {});

  const [inserted] = await getDb()
    .insert(projectAssets)
    .values({
      projectId,
      chainId: token.chainId,
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      source: trimmedSource,
    })
    .onConflictDoNothing({
      target: [projectAssets.projectId, projectAssets.chainId, projectAssets.address],
    })
    .returning();
  if (inserted) {
    await recordAudit({
      projectId,
      actorUserId: userId,
      action: "asset.add",
      target: `${inserted.symbol} (${inserted.address})`,
    }).catch(() => {});
    return inserted;
  }

  const existing = await getDb().query.projectAssets.findFirst({
    where: and(
      eq(projectAssets.projectId, projectId),
      eq(projectAssets.chainId, token.chainId),
      eq(projectAssets.address, token.address),
    ),
  });
  if (!existing) throw new Error("Could not add the asset.");
  return existing;
}

/** Remove an asset from the registry. */
export async function removeAsset(
  userId: string,
  projectId: string,
  assetId: string,
): Promise<void> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) throw new Error("Not authorized.");
  await getDb()
    .delete(projectAssets)
    .where(and(eq(projectAssets.id, assetId), eq(projectAssets.projectId, projectId)));
  await recordAudit({
    projectId,
    actorUserId: userId,
    action: "asset.remove",
    target: assetId,
  }).catch(() => {});
}
