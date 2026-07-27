"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSessionUser } from "@/lib/auth/session";
import { deleteProject, renameProject } from "@/server/projects";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function renameProjectAction(input: {
  projectId: string;
  name: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSessionUser();
    await renameProject(session.user.id, input.projectId, input.name);
    revalidatePath(`/app/${input.projectId}/settings`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Rename failed." };
  }
}

export async function deleteProjectAction(input: {
  projectId: string;
}): Promise<ActionResult | undefined> {
  const session = await requireSessionUser();
  try {
    await deleteProject(session.user.id, input.projectId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Delete failed." };
  }
  redirect("/app/projects");
}
