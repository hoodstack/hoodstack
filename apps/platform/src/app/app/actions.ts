"use server";

import { revalidatePath } from "next/cache";

import type { KeyEnvironment } from "@/lib/api-keys";
import { requireSessionUser } from "@/lib/auth/session";
import { mintApiKey, revokeApiKey } from "@/server/api-keys";
import { createProject } from "@/server/projects";

/**
 * Server actions for the dashboard.
 *
 * Each one re-derives the session from the request (never trusting a client-sent
 * id for identity) and delegates to the org-scoped data layer, which enforces
 * membership. The result shapes are deliberately small and serializable.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Create a project in the caller's default org. */
export async function createProjectAction(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Enter a project name." };

  try {
    const session = await requireSessionUser();
    await createProject(session.user.id, session.defaultOrg.id, name);
    revalidatePath("/app/projects");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

/**
 * Mint an API key. The plaintext is returned to the caller once and never again;
 * the UI reveals it and then can only ever show the prefix and last four.
 */
export async function mintKeyAction(input: {
  projectId: string;
  name: string;
  environment: KeyEnvironment;
}): Promise<ActionResult<{ plaintext: string; prefix: string; lastFour: string }>> {
  try {
    const session = await requireSessionUser();
    const { record, plaintext } = await mintApiKey(
      session.user.id,
      input.projectId,
      input.name,
      input.environment,
    );
    revalidatePath(`/app/${input.projectId}`);
    return {
      ok: true,
      data: { plaintext, prefix: record.prefix, lastFour: record.lastFour },
    };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

/** Revoke a key the caller owns. */
export async function revokeKeyAction(input: {
  projectId: string;
  keyId: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSessionUser();
    await revokeApiKey(session.user.id, input.keyId);
    revalidatePath(`/app/${input.projectId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
