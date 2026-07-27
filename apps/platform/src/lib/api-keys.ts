import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * API key format and hashing.
 *
 * A key looks like `hs_live_<secret>` or `hs_test_<secret>`, where `<secret>` is
 * 24 random bytes in base64url (~32 chars). We never store the plaintext: only a
 * SHA-256 hash for constant-time lookup, plus a non-secret display prefix and
 * last four characters. SHA-256 (not bcrypt) is deliberate, these are
 * high-entropy random tokens, not human passwords, so a fast hash is correct and
 * lets us look a key up by its hash on every gateway request.
 */

export type KeyEnvironment = "live" | "test";

export type GeneratedKey = {
  /** Shown to the user exactly once, never persisted. */
  plaintext: string;
  /** Display prefix, e.g. `hs_live`. Safe to store and show. */
  prefix: string;
  /** Last four characters of the secret. Safe to store and show. */
  lastFour: string;
  /** SHA-256 hex of the plaintext. The only form we persist. */
  keyHash: string;
};

/** SHA-256 hex of a full key string. */
export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

/** Mint a new key for an environment. */
export function generateApiKey(environment: KeyEnvironment): GeneratedKey {
  const secret = randomBytes(24).toString("base64url");
  const plaintext = `hs_${environment}_${secret}`;
  return {
    plaintext,
    prefix: `hs_${environment}`,
    lastFour: secret.slice(-4),
    keyHash: hashApiKey(plaintext),
  };
}

/** The environment a key claims, from its prefix, or null if malformed. */
export function environmentOf(plaintext: string): KeyEnvironment | null {
  if (plaintext.startsWith("hs_live_")) return "live";
  if (plaintext.startsWith("hs_test_")) return "test";
  return null;
}

/** Basic shape check before doing any database work on a presented key. */
export function looksLikeApiKey(value: string): boolean {
  return environmentOf(value) !== null && value.length >= 16 && value.length <= 128;
}

/** Constant-time comparison of two hex hashes of equal length. */
export function hashesEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
