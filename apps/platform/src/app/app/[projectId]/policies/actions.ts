"use server";

import { revalidatePath } from "next/cache";
import { parseEther } from "viem";

import { requireSessionUser } from "@/lib/auth/session";
import {
  addAllowlistAddress,
  removeAllowlistAddress,
  updatePolicy,
  type PolicyMode,
} from "@/server/policies";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Save the spending ceiling and allowlist mode. */
export async function updatePolicyAction(input: {
  projectId: string;
  maxValueEth: string;
  allowlistMode: PolicyMode;
}): Promise<ActionResult> {
  try {
    const session = await requireSessionUser();

    let maxValueWei: string | null = null;
    const raw = input.maxValueEth.trim();
    if (raw) {
      try {
        maxValueWei = parseEther(raw).toString();
      } catch {
        return { ok: false, error: "Max value must be a number of ETH." };
      }
    }

    await updatePolicy(session.user.id, input.projectId, {
      maxValueWei,
      allowlistMode: input.allowlistMode,
    });
    revalidatePath(`/app/${input.projectId}/policies`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function addAllowlistAction(input: {
  projectId: string;
  address: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSessionUser();
    await addAllowlistAddress(session.user.id, input.projectId, input.address);
    revalidatePath(`/app/${input.projectId}/policies`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function removeAllowlistAction(input: {
  projectId: string;
  entryId: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSessionUser();
    await removeAllowlistAddress(session.user.id, input.projectId, input.entryId);
    revalidatePath(`/app/${input.projectId}/policies`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
