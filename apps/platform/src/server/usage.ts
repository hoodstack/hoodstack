import "server-only";

import { count, desc, eq, getDb, usageEvents } from "@hoodstack/db";

import { getProjectForMember } from "./projects";

/**
 * Record one metered unit of gateway work.
 *
 * This is the raw ledger the token-utility metering will later aggregate. It is
 * intentionally best-effort at the call site: a usage-write failure must never
 * turn a successful API call into an error for the developer, so callers wrap
 * this and swallow its rejection.
 */
export async function recordUsage(input: {
  projectId: string;
  /** Null for dashboard-originated reads, which authenticate by session, not a key. */
  apiKeyId?: string | null;
  module: string;
  action: string;
  units?: number;
  status?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await getDb()
    .insert(usageEvents)
    .values({
      projectId: input.projectId,
      apiKeyId: input.apiKeyId ?? null,
      module: input.module,
      action: input.action,
      units: input.units ?? 1,
      status: input.status ?? "ok",
      meta: input.meta,
    });
}

/** Total metered requests for a project and when the last one landed. */
export type ProjectUsageSummary = { total: number; lastAt: string | null };

/**
 * Usage totals for a project the caller belongs to. Returns zeroes for a project
 * the user cannot access, so it never leaks whether an id exists.
 */
export async function getProjectUsageSummary(
  userId: string,
  projectId: string,
): Promise<ProjectUsageSummary> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) return { total: 0, lastAt: null };

  const db = getDb();
  const [totals] = await db
    .select({ total: count() })
    .from(usageEvents)
    .where(eq(usageEvents.projectId, projectId));

  const [latest] = await db
    .select({ at: usageEvents.createdAt })
    .from(usageEvents)
    .where(eq(usageEvents.projectId, projectId))
    .orderBy(desc(usageEvents.createdAt))
    .limit(1);

  return {
    total: totals?.total ?? 0,
    lastAt: latest?.at ? latest.at.toISOString() : null,
  };
}
