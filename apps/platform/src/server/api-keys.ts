import "server-only";

import {
  and,
  apiKeys,
  desc,
  eq,
  getDb,
  isNull,
  projects,
  type ApiKey,
  type Project,
} from "@hoodstack/db";

import {
  generateApiKey,
  hashApiKey,
  looksLikeApiKey,
  type KeyEnvironment,
} from "@/lib/api-keys";

import { getProjectForMember } from "./projects";

/** A freshly minted key: the stored record plus its one-time plaintext. */
export type MintedKey = { record: ApiKey; plaintext: string };

/** An authenticated gateway caller: the key and the project it belongs to. */
export type AuthenticatedKey = { key: ApiKey; project: Project };

/**
 * Mint a key for a project the user owns. The returned `plaintext` is the only
 * time the full key exists outside the caller, it is never stored.
 */
export async function mintApiKey(
  userId: string,
  projectId: string,
  name: string,
  environment: KeyEnvironment,
): Promise<MintedKey> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) throw new Error("Project not found");

  const generated = generateApiKey(environment);
  const [record] = await getDb()
    .insert(apiKeys)
    .values({
      projectId,
      name: name.trim() || `${environment} key`,
      environment,
      prefix: generated.prefix,
      keyHash: generated.keyHash,
      lastFour: generated.lastFour,
    })
    .returning();

  return { record: record!, plaintext: generated.plaintext };
}

/** Keys for a project the user belongs to, newest first. */
export async function listApiKeys(userId: string, projectId: string): Promise<ApiKey[]> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) return [];
  return getDb()
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.projectId, projectId))
    .orderBy(desc(apiKeys.createdAt));
}

/** Revoke a key (soft, by timestamp) if the user owns its project. */
export async function revokeApiKey(userId: string, keyId: string): Promise<void> {
  const key = await getDb().query.apiKeys.findFirst({ where: eq(apiKeys.id, keyId) });
  if (!key) return;
  const project = await getProjectForMember(userId, key.projectId);
  if (!project) throw new Error("Not authorized to revoke this key");
  await getDb()
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}

/**
 * Authenticate a presented key for the gateway.
 *
 * Returns the active key and its project, or null. A shape check runs before any
 * database work so malformed input costs nothing. Only non-revoked keys match.
 * `lastUsedAt` is updated on success, awaited, because a serverless function
 * may freeze the moment it returns, dropping a fire-and-forget write.
 */
export async function authenticateApiKey(
  plaintext: string,
): Promise<AuthenticatedKey | null> {
  if (!looksLikeApiKey(plaintext)) return null;

  const db = getDb();
  const rows = await db
    .select({ key: apiKeys, project: projects })
    .from(apiKeys)
    .innerJoin(projects, eq(apiKeys.projectId, projects.id))
    .where(and(eq(apiKeys.keyHash, hashApiKey(plaintext)), isNull(apiKeys.revokedAt)))
    .limit(1);

  const found = rows[0];
  if (!found) return null;

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, found.key.id));

  return found;
}
