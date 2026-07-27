"use server";

import { revalidatePath } from "next/cache";

import { requireSessionUser } from "@/lib/auth/session";
import {
  addWebhook,
  removeWebhook,
  sendTestDelivery,
  type DeliveryResult,
} from "@/server/webhooks";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addWebhookAction(input: {
  projectId: string;
  url: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSessionUser();
    await addWebhook(session.user.id, input.projectId, input.url);
    revalidatePath(`/app/${input.projectId}/webhooks`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function removeWebhookAction(input: {
  projectId: string;
  id: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSessionUser();
    await removeWebhook(session.user.id, input.projectId, input.id);
    revalidatePath(`/app/${input.projectId}/webhooks`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export type TestOutcome =
  | { ok: true; data: DeliveryResult }
  | { ok: false; error: string };

export async function testWebhookAction(input: {
  projectId: string;
  id: string;
}): Promise<TestOutcome> {
  try {
    const session = await requireSessionUser();
    const data = await sendTestDelivery(session.user.id, input.projectId, input.id);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
