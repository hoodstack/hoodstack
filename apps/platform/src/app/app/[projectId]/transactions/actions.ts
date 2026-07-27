"use server";

import {
  readTransaction,
  simulateTransaction,
  type SimulationRequest,
  type SimulationResult,
  type TransactionSummary,
} from "@hoodstack/network";
import { parseEther } from "viem";

import type { KeyEnvironment } from "@/lib/api-keys";
import { requireSessionUser } from "@/lib/auth/session";
import { chainForEnvironment, rpcUrlsForEnvironment } from "@/server/chain";
import { evaluatePolicy, getPolicy, type PolicyViolation } from "@/server/policies";
import { getProjectForMember } from "@/server/projects";
import { recordUsage } from "@/server/usage";

export type SimulateOutcome =
  | { ok: true; data: { simulation: SimulationResult; violations: PolicyViolation[] } }
  | { ok: false; error: string };

/**
 * Simulate a transaction (eth_call + estimate gas) and evaluate it against the
 * project's execution policy. Nothing is signed or submitted. Metered.
 */
export async function simulateTransactionAction(input: {
  projectId: string;
  environment: KeyEnvironment;
  from?: string;
  to: string;
  valueEth?: string;
  data?: string;
}): Promise<SimulateOutcome> {
  try {
    const session = await requireSessionUser();
    const project = await getProjectForMember(session.user.id, input.projectId);
    if (!project) return { ok: false, error: "Project not found." };

    let valueWei = "0";
    if (input.valueEth && input.valueEth.trim()) {
      try {
        valueWei = parseEther(input.valueEth.trim()).toString();
      } catch {
        return { ok: false, error: "Value must be a number of ETH." };
      }
    }

    const req: SimulationRequest = { to: input.to.trim(), valueWei };
    if (input.from && input.from.trim()) req.from = input.from.trim();
    if (input.data && input.data.trim()) req.data = input.data.trim();

    const simulation = await simulateTransaction(
      rpcUrlsForEnvironment(input.environment),
      req,
      { timeoutMs: 10_000 },
    );

    const policy = await getPolicy(session.user.id, input.projectId);
    const violations = evaluatePolicy(policy, { to: req.to, valueWei });

    await recordUsage({
      projectId: project.id,
      module: "transactions",
      action: "simulate",
      status: simulation.success ? "ok" : "reverted",
      meta: { to: req.to, environment: input.environment },
    }).catch(() => {});

    return { ok: true, data: { simulation, violations } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Simulation failed.",
    };
  }
}

export type LookupOutcome =
  | { ok: true; data: TransactionSummary }
  | { ok: false; error: string };

/** Look up a transaction by hash with its receipt. Metered. */
export async function lookupTransactionAction(input: {
  projectId: string;
  environment: KeyEnvironment;
  hash: string;
}): Promise<LookupOutcome> {
  try {
    const session = await requireSessionUser();
    const project = await getProjectForMember(session.user.id, input.projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const tx = await readTransaction(
      rpcUrlsForEnvironment(input.environment),
      chainForEnvironment(input.environment),
      input.hash.trim(),
      { timeoutMs: 10_000 },
    );

    await recordUsage({
      projectId: project.id,
      module: "transactions",
      action: "transaction",
      meta: { hash: tx.hash, environment: input.environment },
    }).catch(() => {});

    return { ok: true, data: tx };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Lookup failed.",
    };
  }
}
