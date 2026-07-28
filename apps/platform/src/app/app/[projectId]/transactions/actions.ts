"use server";

import {
  readTransaction,
  simulateTransaction,
  type SimulationRequest,
  type SimulationResult,
  type TransactionSummary,
} from "@hoodstack/network";
import { isAddress, parseEther, type Address } from "viem";

import type { KeyEnvironment } from "@/lib/api-keys";
import { requireSessionUser } from "@/lib/auth/session";
import {
  buildUserOperation,
  submitUserOperation,
  writesEnabled,
  type CallRequest,
  type SerializedUserOp,
  type SubmitResult,
} from "@/server/aa";
import { recordAudit } from "@/server/audit";
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

// --- Signed submission (ERC-4337) ---------------------------------------------

function toValueWei(valueEth?: string): string | null {
  if (!valueEth || !valueEth.trim()) return "0";
  try {
    return parseEther(valueEth.trim()).toString();
  } catch {
    return null;
  }
}

export type PrepareOutcome =
  | { ok: true; data: { userOp: SerializedUserOp; userOpHash: string } }
  | { ok: false; error: string; violations?: PolicyViolation[] };

/**
 * Build the exact UserOperation the owner will sign, from their wallet address.
 * Policy is evaluated server-side first; the server holds no key. The returned
 * op is signed client-side and passed back to {@link submitSignedAction}.
 */
export async function prepareSubmitAction(input: {
  projectId: string;
  environment: KeyEnvironment;
  ownerAddress: string;
  to: string;
  valueEth?: string;
  data?: string;
}): Promise<PrepareOutcome> {
  try {
    const session = await requireSessionUser();
    const project = await getProjectForMember(session.user.id, input.projectId);
    if (!project) return { ok: false, error: "Project not found." };
    if (!writesEnabled(input.environment)) {
      return { ok: false, error: "Signed submission is not enabled for this network yet." };
    }
    if (!isAddress(input.ownerAddress)) return { ok: false, error: "Connect a wallet to sign." };
    if (!isAddress(input.to)) return { ok: false, error: "Enter a valid recipient address." };

    const valueWei = toValueWei(input.valueEth);
    if (valueWei === null) return { ok: false, error: "Value must be a number of ETH." };
    const data = input.data && input.data.trim() ? (input.data.trim() as `0x${string}`) : "0x";

    const policy = await getPolicy(session.user.id, input.projectId);
    const violations = evaluatePolicy(policy, { to: input.to, valueWei });
    if (violations.length > 0) return { ok: false, error: "Blocked by policy.", violations };

    const calls: CallRequest[] = [{ to: input.to as Address, valueWei, data }];
    const built = await buildUserOperation(input.environment, input.ownerAddress as Address, calls);
    return { ok: true, data: built };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to prepare." };
  }
}

export type SubmitOutcome =
  | { ok: true; data: SubmitResult }
  | { ok: false; error: string; violations?: PolicyViolation[] };

/**
 * Submit a client-signed UserOperation via the relayer. Re-checks policy and
 * verifies the op does exactly the requested call before submitting. Metered and
 * audit-logged. The relayer only relays; it can never move the account's funds.
 */
export async function submitSignedAction(input: {
  projectId: string;
  environment: KeyEnvironment;
  ownerAddress: string;
  to: string;
  valueEth?: string;
  data?: string;
  userOp: SerializedUserOp;
}): Promise<SubmitOutcome> {
  try {
    const session = await requireSessionUser();
    const project = await getProjectForMember(session.user.id, input.projectId);
    if (!project) return { ok: false, error: "Project not found." };
    if (!writesEnabled(input.environment)) {
      return { ok: false, error: "Signed submission is not enabled for this network yet." };
    }
    if (!isAddress(input.ownerAddress) || !isAddress(input.to)) {
      return { ok: false, error: "Invalid address." };
    }

    const valueWei = toValueWei(input.valueEth);
    if (valueWei === null) return { ok: false, error: "Value must be a number of ETH." };
    const data = input.data && input.data.trim() ? (input.data.trim() as `0x${string}`) : "0x";

    const policy = await getPolicy(session.user.id, input.projectId);
    const violations = evaluatePolicy(policy, { to: input.to, valueWei });
    if (violations.length > 0) return { ok: false, error: "Blocked by policy.", violations };

    const calls: CallRequest[] = [{ to: input.to as Address, valueWei, data }];
    const result = await submitUserOperation(
      input.environment,
      input.ownerAddress as Address,
      calls,
      input.userOp,
    );

    await recordUsage({
      projectId: project.id,
      module: "transactions",
      action: "submit",
      status: result.success ? "ok" : "reverted",
      meta: { to: input.to, userOpHash: result.userOpHash, environment: input.environment },
    }).catch(() => {});
    await recordAudit({
      projectId: project.id,
      actorUserId: session.user.id,
      action: "transaction.submit",
      target: result.userOpHash,
      meta: {
        to: input.to,
        valueWei,
        txHash: result.transactionHash,
        success: result.success,
        environment: input.environment,
      },
    }).catch(() => {});

    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Submission failed." };
  }
}
