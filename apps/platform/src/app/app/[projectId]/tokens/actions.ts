"use server";

import { readToken, type TokenSummary } from "@hoodstack/network";

import type { KeyEnvironment } from "@/lib/api-keys";
import { requireSessionUser } from "@/lib/auth/session";
import { chainForEnvironment, rpcUrlsForEnvironment } from "@/server/chain";
import { getProjectForMember } from "@/server/projects";
import { recordUsage } from "@/server/usage";

export type TokenResult = { ok: true; data: TokenSummary } | { ok: false; error: string };

/** Read ERC-20 metadata (and optionally a holder balance) for a token. Metered. */
export async function getTokenAction(input: {
  projectId: string;
  environment: KeyEnvironment;
  address: string;
  holder?: string;
}): Promise<TokenResult> {
  try {
    const session = await requireSessionUser();
    const project = await getProjectForMember(session.user.id, input.projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const holder = input.holder && input.holder.trim() ? input.holder.trim() : undefined;
    const summary = await readToken(
      rpcUrlsForEnvironment(input.environment),
      chainForEnvironment(input.environment),
      input.address.trim(),
      holder,
      { timeoutMs: 10_000 },
    );

    await recordUsage({
      projectId: project.id,
      module: "tokens",
      action: "token",
      meta: { address: summary.address, environment: input.environment },
    }).catch(() => {});

    return { ok: true, data: summary };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Read failed." };
  }
}
