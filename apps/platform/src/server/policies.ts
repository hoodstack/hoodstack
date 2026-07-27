import "server-only";

import {
  and,
  asc,
  eq,
  getDb,
  policyAllowlist,
  projectPolicies,
} from "@hoodstack/db";
import { getAddress, isAddress } from "viem";

import { getProjectForMember } from "./projects";

/**
 * Execution policy for a project.
 *
 * A spending ceiling and an optional recipient allowlist. These are evaluated
 * against a simulated transaction today (see `evaluatePolicy`), which is how
 * Policies does real work before signed execution exists to enforce them at
 * submit time. Every function is membership-scoped.
 */

export type PolicyMode = "off" | "enforce";

export type ProjectPolicyView = {
  maxValueWei: string | null;
  allowlistMode: PolicyMode;
  allowlist: { id: string; address: string }[];
};

const EMPTY: ProjectPolicyView = { maxValueWei: null, allowlistMode: "off", allowlist: [] };

export async function getPolicy(
  userId: string,
  projectId: string,
): Promise<ProjectPolicyView> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) return EMPTY;

  const db = getDb();
  const policy = await db.query.projectPolicies.findFirst({
    where: eq(projectPolicies.projectId, projectId),
  });
  const allowlist = await db
    .select({ id: policyAllowlist.id, address: policyAllowlist.address })
    .from(policyAllowlist)
    .where(eq(policyAllowlist.projectId, projectId))
    .orderBy(asc(policyAllowlist.createdAt));

  return {
    maxValueWei: policy?.maxValueWei ?? null,
    allowlistMode: policy?.allowlistMode ?? "off",
    allowlist,
  };
}

/** Upsert the project's spending ceiling and allowlist mode. */
export async function updatePolicy(
  userId: string,
  projectId: string,
  input: { maxValueWei: string | null; allowlistMode: PolicyMode },
): Promise<void> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) throw new Error("Not authorized.");

  await getDb()
    .insert(projectPolicies)
    .values({
      projectId,
      maxValueWei: input.maxValueWei,
      allowlistMode: input.allowlistMode,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: projectPolicies.projectId,
      set: {
        maxValueWei: input.maxValueWei,
        allowlistMode: input.allowlistMode,
        updatedAt: new Date(),
      },
    });
}

export async function addAllowlistAddress(
  userId: string,
  projectId: string,
  address: string,
): Promise<void> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) throw new Error("Not authorized.");
  const trimmed = address.trim();
  if (!isAddress(trimmed)) throw new Error(`"${trimmed}" is not a valid address.`);
  await getDb()
    .insert(policyAllowlist)
    .values({ projectId, address: getAddress(trimmed) })
    .onConflictDoNothing({
      target: [policyAllowlist.projectId, policyAllowlist.address],
    });
}

export async function removeAllowlistAddress(
  userId: string,
  projectId: string,
  entryId: string,
): Promise<void> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) throw new Error("Not authorized.");
  await getDb()
    .delete(policyAllowlist)
    .where(
      and(eq(policyAllowlist.id, entryId), eq(policyAllowlist.projectId, projectId)),
    );
}

export type PolicyViolation = { rule: "max_value" | "allowlist"; message: string };

/** Evaluate a (simulated) transaction against a policy. Pure; no I/O. */
export function evaluatePolicy(
  policy: ProjectPolicyView,
  tx: { to: string; valueWei: string },
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  if (policy.maxValueWei !== null) {
    try {
      if (BigInt(tx.valueWei) > BigInt(policy.maxValueWei)) {
        violations.push({
          rule: "max_value",
          message: "Value exceeds the configured maximum.",
        });
      }
    } catch {
      // Unparseable value: treat as no max-value violation.
    }
  }

  if (policy.allowlistMode === "enforce") {
    const allowed = policy.allowlist.some(
      (entry) => entry.address.toLowerCase() === tx.to.toLowerCase(),
    );
    if (!allowed) {
      violations.push({
        rule: "allowlist",
        message: "Recipient is not on the allowlist.",
      });
    }
  }

  return violations;
}
