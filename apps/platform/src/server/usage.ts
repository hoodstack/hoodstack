import "server-only";

import { and, apiKeys, count, desc, eq, getDb, gte, usageEvents } from "@hoodstack/db";

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

/** One row in the activity feed. */
export type ActivityEvent = {
  id: number;
  module: string;
  action: string;
  status: string;
  createdAt: string;
  keyName: string | null;
  keyEnvironment: string | null;
  meta: Record<string, unknown> | null;
};

/**
 * The project's most recent metered events, newest first, joined to the key that
 * made each call (null for dashboard-originated reads). Membership-scoped, so it
 * returns nothing for a project the caller cannot access.
 */
export async function getRecentActivity(
  userId: string,
  projectId: string,
  limit = 50,
): Promise<ActivityEvent[]> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) return [];

  const rows = await getDb()
    .select({
      id: usageEvents.id,
      module: usageEvents.module,
      action: usageEvents.action,
      status: usageEvents.status,
      createdAt: usageEvents.createdAt,
      meta: usageEvents.meta,
      keyName: apiKeys.name,
      keyEnvironment: apiKeys.environment,
    })
    .from(usageEvents)
    .leftJoin(apiKeys, eq(usageEvents.apiKeyId, apiKeys.id))
    .where(eq(usageEvents.projectId, projectId))
    .orderBy(desc(usageEvents.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));

  return rows.map((row) => ({
    id: row.id,
    module: row.module,
    action: row.action,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    keyName: row.keyName ?? null,
    keyEnvironment: row.keyEnvironment ?? null,
    meta: row.meta ?? null,
  }));
}

export type UsageBreakdown = {
  total: number;
  last7d: number;
  byModule: { key: string; count: number }[];
  byAction: { key: string; count: number }[];
};

/** Usage totals for a project, broken down by module and action. */
export async function getUsageBreakdown(
  userId: string,
  projectId: string,
): Promise<UsageBreakdown> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) return { total: 0, last7d: 0, byModule: [], byAction: [] };

  const db = getDb();
  const where = eq(usageEvents.projectId, projectId);
  const since = new Date(Date.now() - 7 * 86_400_000);

  const [totals] = await db.select({ total: count() }).from(usageEvents).where(where);
  const [recent] = await db
    .select({ total: count() })
    .from(usageEvents)
    .where(and(where, gte(usageEvents.createdAt, since)));

  const byModule = await db
    .select({ key: usageEvents.module, count: count() })
    .from(usageEvents)
    .where(where)
    .groupBy(usageEvents.module);
  const byAction = await db
    .select({ key: usageEvents.action, count: count() })
    .from(usageEvents)
    .where(where)
    .groupBy(usageEvents.action);

  const sort = (rows: { key: string; count: number }[]) =>
    [...rows].sort((a, b) => b.count - a.count);

  return {
    total: totals?.total ?? 0,
    last7d: recent?.total ?? 0,
    byModule: sort(byModule),
    byAction: sort(byAction),
  };
}
