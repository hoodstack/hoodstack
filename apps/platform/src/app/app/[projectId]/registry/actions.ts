"use server";

import { revalidatePath } from "next/cache";

import type { KeyEnvironment } from "@/lib/api-keys";
import { requireSessionUser } from "@/lib/auth/session";
import { addAsset, removeAsset } from "@/server/assets";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Verify and register an ERC-20 in the project registry. */
export async function addAssetAction(input: {
  projectId: string;
  environment: KeyEnvironment;
  address: string;
  source: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSessionUser();
    await addAsset(
      session.user.id,
      input.projectId,
      input.environment,
      input.address,
      input.source,
    );
    revalidatePath(`/app/${input.projectId}/registry`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function removeAssetAction(input: {
  projectId: string;
  assetId: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSessionUser();
    await removeAsset(session.user.id, input.projectId, input.assetId);
    revalidatePath(`/app/${input.projectId}/registry`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
