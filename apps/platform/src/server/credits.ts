import "server-only";

import { and, count, creditGrants, desc, eq, getDb, usageEvents } from "@hoodstack/db";

import { getProjectForMember } from "./projects";

/**
 * Usage credits.
 *
 * An offchain, non-transferable ledger. A project's balance is the sum of its
 * grants minus its metered consumption (from usage_events). Today the only grant
 * is the free-tier allocation; conventional payment and, later, token-funded
 * top-ups add further grants without changing this model. One credit is one
 * metered request.
 */

export const FREE_TIER_CREDITS = 100_000;
export const CREDITS_PER_REQUEST = 1;

export type CreditSummary = {
  granted: number;
  consumed: number;
  balance: number;
  freeTier: number;
  grants: { id: number; amount: number; reason: string; createdAt: string }[];
};

const EMPTY: CreditSummary = {
  granted: 0,
  consumed: 0,
  balance: 0,
  freeTier: FREE_TIER_CREDITS,
  grants: [],
};

/** Grant the free-tier allocation once, the first time credits are viewed. */
async function ensureFreeTier(projectId: string): Promise<void> {
  const db = getDb();
  const [existing] = await db
    .select({ id: creditGrants.id })
    .from(creditGrants)
    .where(and(eq(creditGrants.projectId, projectId), eq(creditGrants.reason, "free_tier")))
    .limit(1);
  if (!existing) {
    await db
      .insert(creditGrants)
      .values({ projectId, amount: FREE_TIER_CREDITS, reason: "free_tier" });
  }
}

export async function getCreditSummary(
  userId: string,
  projectId: string,
): Promise<CreditSummary> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) return EMPTY;

  await ensureFreeTier(projectId);
  const db = getDb();

  const grants = await db
    .select()
    .from(creditGrants)
    .where(eq(creditGrants.projectId, projectId))
    .orderBy(desc(creditGrants.createdAt));
  const granted = grants.reduce((sum, grant) => sum + grant.amount, 0);

  const [usage] = await db
    .select({ total: count() })
    .from(usageEvents)
    .where(eq(usageEvents.projectId, projectId));
  const consumed = (usage?.total ?? 0) * CREDITS_PER_REQUEST;

  return {
    granted,
    consumed,
    balance: Math.max(0, granted - consumed),
    freeTier: FREE_TIER_CREDITS,
    grants: grants.map((grant) => ({
      id: grant.id,
      amount: grant.amount,
      reason: grant.reason,
      createdAt: grant.createdAt.toISOString(),
    })),
  };
}
