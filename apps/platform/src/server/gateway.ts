import "server-only";

import {
  HoodStackError,
  isHoodStackError,
  normalizeError,
} from "@hoodstack/errors";
import { randomUUID } from "node:crypto";

import { authenticateApiKey, type AuthenticatedKey } from "./api-keys";
import { checkRateLimit } from "./rate-limit";

/**
 * Shared gateway machinery for `/api/v1/*`.
 *
 * Every public API route runs the same spine: pull the key off the request,
 * authenticate it, enforce a rate limit, do the work, and shape both success and
 * failure into a consistent JSON envelope carrying a request id. Errors are
 * always HoodStackErrors, so status codes and machine-readable codes stay
 * uniform across the whole surface.
 */

/** Extract the presented key from `Authorization: Bearer` or `x-api-key`. */
export function extractApiKey(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header) {
    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token) return token.trim();
  }
  const alt = request.headers.get("x-api-key");
  return alt ? alt.trim() : null;
}

/**
 * Authenticate the request's API key or throw. On success returns the key and
 * its project; the caller uses those for scoping, chain selection, and metering.
 */
export async function authenticateRequest(request: Request): Promise<AuthenticatedKey> {
  const presented = extractApiKey(request);
  if (!presented) {
    throw new HoodStackError("HS_AUTH_REQUIRED", {
      message: "Provide an API key via `Authorization: Bearer <key>` or `x-api-key`.",
    });
  }
  const authenticated = await authenticateApiKey(presented);
  if (!authenticated) {
    throw new HoodStackError("HS_INVALID_API_KEY", {
      message: "The API key is missing, malformed, or has been revoked.",
    });
  }
  return authenticated;
}

/** Enforce the per-key rate limit or throw HS_RATE_LIMITED. */
export async function enforceRateLimit(keyId: string): Promise<void> {
  const result = await checkRateLimit(keyId);
  if (!result.ok) {
    const retryAfterMs = Math.max(0, result.reset - Date.now());
    throw new HoodStackError("HS_RATE_LIMITED", {
      message: "Rate limit exceeded. Slow down and retry after the indicated delay.",
      retryAfterMs,
      details: { limit: result.limit },
    });
  }
}

/** JSON success envelope with a request id. */
export function jsonOk(data: unknown, requestId: string, init?: ResponseInit): Response {
  return Response.json(
    { ok: true, requestId, data },
    { ...init, headers: { ...init?.headers, "x-request-id": requestId } },
  );
}

/**
 * Turn any thrown value into the standard error response. Unknown errors are
 * normalized to a HoodStackError first, so nothing leaks a raw stack or an
 * inconsistent shape to callers.
 */
export function jsonError(error: unknown, requestId: string): Response {
  const hs = isHoodStackError(error) ? error : normalizeError(error);
  const body = { ok: false, requestId, error: { ...hs.toJSON(), requestId } };

  const headers: Record<string, string> = { "x-request-id": requestId };
  if (hs.retryAfterMs !== undefined) {
    headers["retry-after"] = Math.ceil(hs.retryAfterMs / 1000).toString();
  }
  return Response.json(body, { status: hs.httpStatus, headers });
}

/** A fresh request id for correlating logs and responses. */
export function newRequestId(): string {
  return randomUUID();
}
