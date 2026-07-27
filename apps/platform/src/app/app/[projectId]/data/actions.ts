"use server";

import {
  readAccountSummary,
  readTransaction,
  type AccountSummary,
  type TransactionSummary,
} from "@hoodstack/network";

import type { KeyEnvironment } from "@/lib/api-keys";
import { requireSessionUser } from "@/lib/auth/session";
import { chainForEnvironment, rpcUrlsForEnvironment } from "@/server/chain";
import { getProjectForMember } from "@/server/projects";
import { recordUsage } from "@/server/usage";

/**
 * Dashboard reads for the Data module.
 *
 * These run the same @hoodstack/network read logic the public API uses, but
 * authenticate by session + project membership rather than an API key — so the
 * developer can explore chain state without pasting a key into their own
 * dashboard. Usage is still metered (with no key attributed).
 */

export type LookupResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function authorizeProject(projectId: string) {
  const session = await requireSessionUser();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) throw new Error("Project not found.");
  return project;
}

export async function lookupAccountAction(input: {
  projectId: string;
  environment: KeyEnvironment;
  address: string;
}): Promise<LookupResult<AccountSummary>> {
  try {
    const project = await authorizeProject(input.projectId);
    const summary = await readAccountSummary(
      rpcUrlsForEnvironment(input.environment),
      chainForEnvironment(input.environment),
      input.address.trim(),
      { timeoutMs: 10_000 },
    );
    await recordUsage({
      projectId: project.id,
      module: "data",
      action: "account",
      meta: { address: summary.address, environment: input.environment },
    }).catch(() => {});
    return { ok: true, data: summary };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function lookupTransactionAction(input: {
  projectId: string;
  environment: KeyEnvironment;
  hash: string;
}): Promise<LookupResult<TransactionSummary>> {
  try {
    const project = await authorizeProject(input.projectId);
    const summary = await readTransaction(
      rpcUrlsForEnvironment(input.environment),
      chainForEnvironment(input.environment),
      input.hash.trim(),
      { timeoutMs: 10_000 },
    );
    await recordUsage({
      projectId: project.id,
      module: "data",
      action: "transaction",
      meta: { hash: summary.hash, environment: input.environment },
    }).catch(() => {});
    return { ok: true, data: summary };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
