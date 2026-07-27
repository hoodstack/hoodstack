import "server-only";

import { eq, getDb, projects, type Project } from "@hoodstack/db";

import { orgMembership } from "@/lib/auth/session";

/**
 * Project data access.
 *
 * Every function here takes the acting `userId` and checks org membership before
 * touching a project. That check is the tenancy boundary: there is no code path
 * that returns a project without first proving the caller belongs to its org.
 */

function projectSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "project"}-${suffix}`;
}

/** Projects in an org, newest first — empty if the user is not a member. */
export async function listProjects(userId: string, orgId: string): Promise<Project[]> {
  const member = await orgMembership(userId, orgId);
  if (!member) return [];
  return getDb()
    .select()
    .from(projects)
    .where(eq(projects.orgId, orgId))
    .orderBy(projects.createdAt);
}

/** Create a project in an org the user belongs to. */
export async function createProject(
  userId: string,
  orgId: string,
  name: string,
): Promise<Project> {
  const member = await orgMembership(userId, orgId);
  if (!member) throw new Error("Not a member of this organization");
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Project name is required");

  const [project] = await getDb()
    .insert(projects)
    .values({ orgId, name: trimmed, slug: projectSlug(trimmed) })
    .returning();
  return project!;
}

/** A single project, only if the user belongs to its org — otherwise null. */
export async function getProjectForMember(
  userId: string,
  projectId: string,
): Promise<Project | null> {
  const project = await getDb().query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
  if (!project) return null;
  const member = await orgMembership(userId, project.orgId);
  return member ? project : null;
}
