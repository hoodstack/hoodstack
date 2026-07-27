"use server";

import { readGas, type GasSummary } from "@hoodstack/network";

import type { KeyEnvironment } from "@/lib/api-keys";
import { requireSessionUser } from "@/lib/auth/session";
import { chainForEnvironment, rpcUrlsForEnvironment } from "@/server/chain";
import { getProjectForMember } from "@/server/projects";
import { recordUsage } from "@/server/usage";

export type GasResult = { ok: true; data: GasSummary } | { ok: false; error: string };

/** Live gas price and base fee for the project's network. Metered. */
export async function getGasAction(input: {
  projectId: string;
  environment: KeyEnvironment;
}): Promise<GasResult> {
  try {
    const session = await requireSessionUser();
    const project = await getProjectForMember(session.user.id, input.projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const summary = await readGas(
      rpcUrlsForEnvironment(input.environment),
      chainForEnvironment(input.environment),
      { timeoutMs: 10_000 },
    );

    await recordUsage({
      projectId: project.id,
      module: "gas",
      action: "price",
      meta: { environment: input.environment },
    }).catch(() => {});

    return { ok: true, data: summary };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to read gas." };
  }
}
