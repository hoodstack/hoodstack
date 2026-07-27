"use server";

import { readBlock } from "@hoodstack/network";

import type { KeyEnvironment } from "@/lib/api-keys";
import { requireSessionUser } from "@/lib/auth/session";
import { chainForEnvironment, rpcUrlsForEnvironment } from "@/server/chain";
import { getProjectForMember } from "@/server/projects";
import { recordUsage } from "@/server/usage";

export type NetworkStatus = {
  blockNumber: number;
  timestamp: string;
  chainName: string;
  chainId: number;
  transactionCount: number;
};

export type NetworkStatusResult =
  | { ok: true; data: NetworkStatus }
  | { ok: false; error: string };

/**
 * Live network status for the overview: the latest block on the project's
 * network. Authenticated by session and project membership, metered like any
 * read. Powers the loading, success, and failure states on the Home page.
 */
export async function getNetworkStatusAction(input: {
  projectId: string;
  environment: KeyEnvironment;
}): Promise<NetworkStatusResult> {
  try {
    const session = await requireSessionUser();
    const project = await getProjectForMember(session.user.id, input.projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const chain = chainForEnvironment(input.environment);
    const block = await readBlock(rpcUrlsForEnvironment(input.environment), "latest", {
      timeoutMs: 10_000,
    });

    await recordUsage({
      projectId: project.id,
      module: "data",
      action: "block",
      meta: { source: "overview" },
    }).catch(() => {});

    return {
      ok: true,
      data: {
        blockNumber: block.number,
        timestamp: block.timestamp,
        chainName: chain.name,
        chainId: chain.id,
        transactionCount: block.transactionCount,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not reach the network.",
    };
  }
}
