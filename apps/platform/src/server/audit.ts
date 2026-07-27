import "server-only";

import { auditLog, desc, eq, getDb, projects, users } from "@hoodstack/db";

import { orgMembership } from "@/lib/auth/session";

/**
 * Append-only audit trail.
 *
 * `recordAudit` is called from mutation code that has already authorized the
 * actor, so it does no membership check and is best-effort: an audit-write
 * failure must never fail the action it records. `listAuditLog` authorizes
 * inline (rather than importing the project data layer, which imports this
 * module) to keep the dependency one-directional.
 */
export async function recordAudit(input: {
  projectId: string;
  actorUserId: string;
  action: string;
  target?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await getDb().insert(auditLog).values({
    projectId: input.projectId,
    actorUserId: input.actorUserId,
    action: input.action,
    target: input.target ?? null,
    meta: input.meta,
  });
}

export type AuditView = {
  id: number;
  action: string;
  target: string | null;
  actorEmail: string | null;
  createdAt: string;
};

export async function listAuditLog(
  userId: string,
  projectId: string,
  limit = 100,
): Promise<AuditView[]> {
  const project = await getDb().query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
  if (!project) return [];
  const member = await orgMembership(userId, project.orgId);
  if (!member) return [];

  const rows = await getDb()
    .select({
      id: auditLog.id,
      action: auditLog.action,
      target: auditLog.target,
      actorEmail: users.email,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.actorUserId, users.id))
    .where(eq(auditLog.projectId, projectId))
    .orderBy(desc(auditLog.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    target: row.target ?? null,
    actorEmail: row.actorEmail ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}
