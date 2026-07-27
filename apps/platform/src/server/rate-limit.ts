import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { serverEnv } from "@/lib/env";

/**
 * Per-key rate limiting, backed by Upstash Redis.
 *
 * When Upstash is not configured (both env vars absent) the limiter is disabled
 * and every request is allowed — so local development and a pre-provisioning
 * deploy still work, just without a ceiling. In production, set the Upstash env
 * vars and the sliding-window limit engages automatically.
 */
let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;

  const env = serverEnv();
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    limiter = null;
    return null;
  }

  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "hs:rl",
    analytics: false,
  });
  return limiter;
}

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/** Check and consume one unit of the rate limit for an identifier (a key id). */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const active = getLimiter();
  if (!active) return { ok: true, limit: 0, remaining: 0, reset: 0 };
  const result = await active.limit(identifier);
  return {
    ok: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
