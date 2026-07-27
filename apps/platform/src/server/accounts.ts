import "server-only";

import { and, asc, eq, getDb, projectAccounts, type ProjectAccount } from "@hoodstack/db";
import { getAddress, isAddress } from "viem";

import { getProjectForMember } from "./projects";

/**
 * The project account registry.
 *
 * Addresses a project chooses to track, each stored checksummed and unique per
 * project. Every function proves org membership before touching a row, so the
 * registry is a strict tenancy boundary like everything else.
 */

/** Accounts a project tracks, oldest first. Empty if the user cannot access it. */
export async function listAccounts(
  userId: string,
  projectId: string,
): Promise<ProjectAccount[]> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) return [];
  return getDb()
    .select()
    .from(projectAccounts)
    .where(eq(projectAccounts.projectId, projectId))
    .orderBy(asc(projectAccounts.createdAt));
}

/**
 * Register an address to track. Validates and checksums the address, and is
 * idempotent per (project, address): registering the same one twice returns the
 * existing row rather than erroring.
 */
export async function addAccount(
  userId: string,
  projectId: string,
  address: string,
  label: string,
): Promise<ProjectAccount> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) throw new Error("Project not found.");

  const trimmed = address.trim();
  if (!isAddress(trimmed)) throw new Error(`"${trimmed}" is not a valid address.`);
  const checksummed = getAddress(trimmed);

  const name =
    label.trim() || `${checksummed.slice(0, 6)}…${checksummed.slice(-4)}`;

  const [inserted] = await getDb()
    .insert(projectAccounts)
    .values({ projectId, address: checksummed, label: name })
    .onConflictDoNothing({
      target: [projectAccounts.projectId, projectAccounts.address],
    })
    .returning();
  if (inserted) return inserted;

  const existing = await getDb().query.projectAccounts.findFirst({
    where: and(
      eq(projectAccounts.projectId, projectId),
      eq(projectAccounts.address, checksummed),
    ),
  });
  if (!existing) throw new Error("Could not add the account.");
  return existing;
}

/** Stop tracking an account, if it belongs to a project the user can access. */
export async function removeAccount(
  userId: string,
  projectId: string,
  accountId: string,
): Promise<void> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) throw new Error("Not authorized.");
  await getDb()
    .delete(projectAccounts)
    .where(
      and(eq(projectAccounts.id, accountId), eq(projectAccounts.projectId, projectId)),
    );
}
