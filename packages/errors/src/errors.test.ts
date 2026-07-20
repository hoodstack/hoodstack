import { describe, expect, it } from "vitest";

import { ERROR_CODES, ERROR_CODE_META, docsUrlForCode } from "./codes.js";
import { HoodStackError, isHoodStackError, isRetryable } from "./error.js";
import { normalizeError } from "./normalize.js";
import { REDACTED, redactDetails } from "./redact.js";

describe("error codes", () => {
  it("has metadata for every declared code", () => {
    for (const code of ERROR_CODES) {
      expect(ERROR_CODE_META[code], `missing metadata for ${code}`).toBeDefined();
    }
  });

  it("declares no metadata for codes that are not exported", () => {
    expect(Object.keys(ERROR_CODE_META).sort()).toEqual([...ERROR_CODES].sort());
  });

  it("uses the HS_ prefix and screaming snake case throughout", () => {
    // The code is a public contract that appears in client branches, docs
    // anchors, and alert rules. A single inconsistent name is a permanent wart.
    for (const code of ERROR_CODES) {
      expect(code, code).toMatch(/^HS_[A-Z0-9]+(_[A-Z0-9]+)*$/);
    }
  });

  it("has no duplicate codes", () => {
    expect(new Set(ERROR_CODES).size).toBe(ERROR_CODES.length);
  });

  it("maps every code to a plausible HTTP status", () => {
    for (const code of ERROR_CODES) {
      const status = ERROR_CODE_META[code].httpStatus;
      expect(status, code).toBeGreaterThanOrEqual(400);
      expect(status, code).toBeLessThan(600);
    }
  });

  it("covers the codes the specification names explicitly", () => {
    for (const code of [
      "HS_AUTH_REQUIRED",
      "HS_INVALID_API_KEY",
      "HS_PROJECT_NOT_FOUND",
      "HS_ENVIRONMENT_NOT_FOUND",
      "HS_ORIGIN_NOT_ALLOWED",
      "HS_CHAIN_MISMATCH",
      "HS_RPC_UNAVAILABLE",
      "HS_TRANSACTION_REVERTED",
      "HS_SIMULATION_FAILED",
      "HS_INSUFFICIENT_FUNDS",
      "HS_GAS_POLICY_REJECTED",
      "HS_GAS_BUDGET_EXCEEDED",
      "HS_USER_OPERATION_REJECTED",
      "HS_USER_OPERATION_TIMEOUT",
      "HS_WEBHOOK_SIGNATURE_INVALID",
      "HS_RATE_LIMITED",
      "HS_PROVIDER_UNAVAILABLE",
      "HS_FEATURE_NOT_ENABLED",
      "HS_CREDIT_BALANCE_EXHAUSTED",
    ] as const) {
      expect(ERROR_CODES, `missing specified code ${code}`).toContain(code);
    }
  });
});

describe("HoodStackError", () => {
  it("derives category, status, and retryability from the code", () => {
    const error = new HoodStackError("HS_RATE_LIMITED");
    expect(error.category).toBe("rate_limit");
    expect(error.httpStatus).toBe(429);
    expect(error.retryable).toBe(true);
  });

  it("lets callers override retryability", () => {
    expect(new HoodStackError("HS_RATE_LIMITED", { retryable: false }).retryable).toBe(
      false,
    );
  });

  it("attaches a documentation link to every error", () => {
    const error = new HoodStackError("HS_GAS_BUDGET_EXCEEDED");
    expect(error.docsUrl).toBe(docsUrlForCode("HS_GAS_BUDGET_EXCEEDED"));
    expect(error.docsUrl).toBe(
      "https://www.hoodstack.io/docs/errors#hs_gas_budget_exceeded",
    );
    expect(error.toJSON().docsUrl).toBeDefined();
  });

  it("round-trips through JSON", () => {
    const original = new HoodStackError("HS_CHAIN_MISMATCH", {
      message: "Connected to 1, expected 46630.",
      details: { expected: 46630, actual: 1 },
      requestId: "req_123",
    });

    const revived = HoodStackError.fromJSON(JSON.parse(JSON.stringify(original)));

    expect(revived.code).toBe("HS_CHAIN_MISMATCH");
    expect(revived.message).toBe("Connected to 1, expected 46630.");
    expect(revived.details).toEqual({ expected: 46630, actual: 1 });
    expect(revived.requestId).toBe("req_123");
    expect(revived.docsUrl).toBe(original.docsUrl);
  });

  it("never serializes a stack trace or cause", () => {
    // A stack trace in an API response leaks file paths and internal structure.
    const error = new HoodStackError("HS_INTERNAL_ERROR", {
      cause: new Error("SELECT * FROM users WHERE secret = 'hunter2'"),
    });

    const serialized = JSON.stringify(error);
    expect(serialized).not.toContain("hunter2");
    expect(serialized).not.toContain("SELECT");
    expect(Object.keys(error.toJSON())).not.toContain("stack");
    expect(Object.keys(error.toJSON())).not.toContain("cause");
  });

  it("preserves the cause for server-side debugging", () => {
    const cause = new Error("upstream detail");
    expect(new HoodStackError("HS_INTERNAL_ERROR", { cause }).cause).toBe(cause);
  });

  it("falls back to HS_INTERNAL_ERROR for unrecognized wire codes", () => {
    expect(HoodStackError.fromJSON({ code: "NOT_A_REAL_CODE" }).code).toBe(
      "HS_INTERNAL_ERROR",
    );
    expect(HoodStackError.fromJSON(null).code).toBe("HS_INTERNAL_ERROR");
  });

  it("does not resolve inherited properties as codes", () => {
    expect(HoodStackError.fromJSON({ code: "constructor" }).code).toBe(
      "HS_INTERNAL_ERROR",
    );
  });

  it("is identifiable without instanceof", () => {
    expect(isHoodStackError(new HoodStackError("HS_TIMEOUT"))).toBe(true);
    expect(isHoodStackError(new Error("plain"))).toBe(false);
    expect(isHoodStackError({ code: "HS_TIMEOUT" })).toBe(false);
  });
});

describe("withRequestId", () => {
  it("tags an error without losing its other fields", () => {
    const original = new HoodStackError("HS_GAS_POLICY_REJECTED", {
      message: "Recipient not on the allowlist.",
      details: { recipient: "0xabc" },
      retryAfterMs: 500,
    });

    const tagged = original.withRequestId("req_abc");

    expect(tagged.requestId).toBe("req_abc");
    expect(tagged.code).toBe(original.code);
    expect(tagged.message).toBe(original.message);
    expect(tagged.details).toEqual(original.details);
    expect(tagged.retryAfterMs).toBe(500);
    expect(original.requestId).toBeUndefined();
  });
});

describe("isRetryable", () => {
  it("refuses to retry non-idempotent operations by default", () => {
    // A submitted transaction that timed out may still land on chain. Retrying
    // without an idempotency key risks double submission.
    expect(isRetryable(new HoodStackError("HS_TIMEOUT"))).toBe(false);
    expect(isRetryable(new HoodStackError("HS_TIMEOUT"), true)).toBe(true);
  });

  it("allows retry regardless of idempotency for rate limits and outages", () => {
    expect(isRetryable(new HoodStackError("HS_RATE_LIMITED"))).toBe(true);
    expect(isRetryable(new HoodStackError("HS_SERVICE_UNAVAILABLE"))).toBe(true);
  });

  it("never retries validation or policy failures", () => {
    expect(isRetryable(new HoodStackError("HS_INVALID_PARAMETER"), true)).toBe(false);
    expect(isRetryable(new HoodStackError("HS_GAS_POLICY_REJECTED"), true)).toBe(false);
    expect(isRetryable(new HoodStackError("HS_CREDIT_BALANCE_EXHAUSTED"), true)).toBe(
      false,
    );
  });

  it("does not retry unknown thrown values", () => {
    expect(isRetryable(new Error("boom"), true)).toBe(false);
  });
});

describe("redactDetails", () => {
  it("redacts sensitive keys at any depth", () => {
    const result = redactDetails({
      chainId: 46630,
      apiKey: "hs_live_abc",
      nested: { privateKey: "0xdead", authorization: "Bearer x", safe: "keep" },
    });

    expect(result).toEqual({
      chainId: 46630,
      apiKey: REDACTED,
      nested: { privateKey: REDACTED, authorization: REDACTED, safe: "keep" },
    });
  });

  it("redacts the credential shapes this platform actually handles", () => {
    const result = redactDetails({
      mnemonic: "test test test",
      seedPhrase: "abandon abandon",
      sessionToken: "sess_1",
      webhookSecret: "whsec_1",
      password: "hunter2",
    });

    expect(Object.values(result)).toEqual([
      REDACTED,
      REDACTED,
      REDACTED,
      REDACTED,
      REDACTED,
    ]);
  });

  it("survives circular references", () => {
    const node: Record<string, unknown> = { name: "root" };
    node["self"] = node;
    expect(redactDetails(node)).toEqual({ name: "root", self: "[circular]" });
  });

  it("applies redaction when details are attached to an error", () => {
    const error = new HoodStackError("HS_INVALID_API_KEY", {
      details: { apiKey: "hs_live_x" },
    });
    expect(error.details).toEqual({ apiKey: REDACTED });
    expect(JSON.stringify(error)).not.toContain("hs_live_x");
  });
});

describe("normalizeError", () => {
  it("passes HoodStack errors through unchanged", () => {
    const original = new HoodStackError("HS_NONCE_CONFLICT");
    expect(normalizeError(original)).toBe(original);
  });

  it("maps aborts to a timeout", () => {
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
    expect(normalizeError(abort).code).toBe("HS_TIMEOUT");
  });

  it("maps fetch transport failures to provider unavailability", () => {
    expect(normalizeError(new TypeError("fetch failed")).code).toBe(
      "HS_PROVIDER_UNAVAILABLE",
    );
  });

  it("preserves the original as cause", () => {
    const cause = new Error("upstream exploded");
    expect(normalizeError(cause, "HS_RPC_ERROR").cause).toBe(cause);
  });

  it("handles non-Error throws", () => {
    expect(normalizeError("something broke").message).toBe("something broke");
    expect(normalizeError(undefined).code).toBe("HS_INTERNAL_ERROR");
  });
});
