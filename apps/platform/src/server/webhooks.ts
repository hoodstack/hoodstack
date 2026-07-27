import "server-only";

import { and, asc, eq, getDb, webhookEndpoints, type WebhookEndpoint } from "@hoodstack/db";
import { createHmac, randomBytes } from "node:crypto";

import { recordAudit } from "./audit";
import { getProjectForMember } from "./projects";
import { recordUsage } from "./usage";

/**
 * Webhook endpoints and signed delivery.
 *
 * Endpoints must be public HTTPS URLs; `assertSafeWebhookUrl` rejects private,
 * loopback, and link-local hosts before we ever make an outbound request, which
 * is the SSRF boundary. Payloads are signed with HMAC-SHA256 over
 * `timestamp.body`, so a receiver can verify authenticity and reject replays.
 */

/** Validate and normalize a webhook URL, or throw. HTTPS and public hosts only. */
export function assertSafeWebhookUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("Enter a valid URL.");
  }
  if (url.protocol !== "https:") throw new Error("Webhook URLs must use https.");
  if (isBlockedHost(url.hostname.toLowerCase())) {
    throw new Error("That host is not allowed. Use a public HTTPS endpoint.");
  }
  return url;
}

function isBlockedHost(host: string): boolean {
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }
  if (host === "::1" || host === "[::1]" || host.startsWith("[fc") || host.startsWith("[fd")) {
    return true;
  }
  const parts = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (parts) {
    const a = Number(parts[1]);
    const b = Number(parts[2]);
    if (a === 0 || a === 10 || a === 127 || a >= 224) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

/** HMAC-SHA256 of `timestamp.body`, hex. The value receivers verify. */
export function signWebhook(secret: string, timestamp: number, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export async function listWebhooks(
  userId: string,
  projectId: string,
): Promise<WebhookEndpoint[]> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) return [];
  return getDb()
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.projectId, projectId))
    .orderBy(asc(webhookEndpoints.createdAt));
}

export async function addWebhook(
  userId: string,
  projectId: string,
  url: string,
): Promise<WebhookEndpoint> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) throw new Error("Project not found.");
  const parsed = assertSafeWebhookUrl(url);
  const [row] = await getDb()
    .insert(webhookEndpoints)
    .values({ projectId, url: parsed.toString(), secret: generateWebhookSecret() })
    .returning();
  await recordAudit({
    projectId,
    actorUserId: userId,
    action: "webhook.add",
    target: row!.url,
  }).catch(() => {});
  return row!;
}

export async function removeWebhook(
  userId: string,
  projectId: string,
  id: string,
): Promise<void> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) throw new Error("Not authorized.");
  await getDb()
    .delete(webhookEndpoints)
    .where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.projectId, projectId)));
  await recordAudit({
    projectId,
    actorUserId: userId,
    action: "webhook.remove",
    target: id,
  }).catch(() => {});
}

export type DeliveryResult = {
  ok: boolean;
  status: number | null;
  latencyMs: number;
  error: string | null;
};

/**
 * Send a signed test event to an endpoint and report the outcome. Re-validates
 * the URL before the request (defense in depth), does not follow redirects, and
 * times out. Metered.
 */
export async function sendTestDelivery(
  userId: string,
  projectId: string,
  id: string,
): Promise<DeliveryResult> {
  const project = await getProjectForMember(userId, projectId);
  if (!project) throw new Error("Not authorized.");

  const endpoint = await getDb().query.webhookEndpoints.findFirst({
    where: and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.projectId, projectId)),
  });
  if (!endpoint) throw new Error("Endpoint not found.");
  assertSafeWebhookUrl(endpoint.url);

  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({
    id: `evt_test_${randomBytes(6).toString("hex")}`,
    type: "webhook.test",
    createdAt: new Date().toISOString(),
    data: { message: "This is a test event from HoodStack." },
  });
  const signature = signWebhook(endpoint.secret, timestamp, body);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  const started = Date.now();
  try {
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-hoodstack-timestamp": String(timestamp),
        "x-hoodstack-signature": `sha256=${signature}`,
        "user-agent": "HoodStack-Webhooks/1",
      },
      body,
      redirect: "manual",
      signal: controller.signal,
    });
    const latencyMs = Date.now() - started;
    await recordUsage({
      projectId: project.id,
      module: "webhooks",
      action: "test",
      status: response.ok ? "ok" : "error",
      meta: { status: response.status },
    }).catch(() => {});
    return {
      ok: response.ok,
      status: response.status,
      latencyMs,
      error: response.ok ? null : `Endpoint responded ${response.status}.`,
    };
  } catch (error) {
    const latencyMs = Date.now() - started;
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Timed out after 8s."
          : error.message
        : "Delivery failed.";
    return { ok: false, status: null, latencyMs, error: message };
  } finally {
    clearTimeout(timer);
  }
}
