"use server";

import { readAccountSummary, type AccountSummary } from "@hoodstack/network";
import { revalidatePath } from "next/cache";

import type { KeyEnvironment } from "@/lib/api-keys";
import { requireSessionUser } from "@/lib/auth/session";
import { addAccount, removeAccount } from "@/server/accounts";
import { chainForEnvironment, rpcUrlsForEnvironment } from "@/server/chain";
import { getProjectForMember } from "@/server/projects";
import { recordUsage } from "@/server/usage";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Register an address to track in this project. */
export async function addAccountAction(input: {
  projectId: string;
  address: string;
  label: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSessionUser();
    await addAccount(session.user.id, input.projectId, input.address, input.label);
    revalidatePath(`/app/${input.projectId}/accounts`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

/** Stop tracking an account. */
export async function removeAccountAction(input: {
  projectId: string;
  accountId: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSessionUser();
    await removeAccount(session.user.id, input.projectId, input.accountId);
    revalidatePath(`/app/${input.projectId}/accounts`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

/**
 * Live on-chain state for a tracked account, on the selected network. Runs the
 * same read logic the Data API uses, authorized by project membership and
 * metered. Powers the per-row loading, success, and error states.
 */
export async function enrichAccountAction(input: {
  projectId: string;
  environment: KeyEnvironment;
  address: string;
}): Promise<ActionResult<AccountSummary>> {
  try {
    const session = await requireSessionUser();
    const project = await getProjectForMember(session.user.id, input.projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const summary = await readAccountSummary(
      rpcUrlsForEnvironment(input.environment),
      chainForEnvironment(input.environment),
      input.address,
      { timeoutMs: 10_000 },
    );

    await recordUsage({
      projectId: project.id,
      module: "accounts",
      action: "account",
      meta: { address: summary.address, environment: input.environment },
    }).catch(() => {});

    return { ok: true, data: summary };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
