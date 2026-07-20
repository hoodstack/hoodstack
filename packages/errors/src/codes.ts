/**
 * Stable, public error codes.
 *
 * These are part of the HoodStack API contract. Once a code ships it must not be
 * renamed or repurposed - clients branch on these strings and alerting rules are
 * written against them. Adding a code is a minor change; changing what an
 * existing one means is a breaking change.
 *
 * Every code is documented at `/docs/errors`, anchored by its lowercased name.
 */
export const ERROR_CODES = [
  // ── authentication ────────────────────────────────────────────────────────
  "HS_AUTH_REQUIRED",
  "HS_INVALID_API_KEY",
  "HS_SESSION_EXPIRED",
  "HS_INVALID_SIGNATURE",

  // ── authorization ─────────────────────────────────────────────────────────
  "HS_PERMISSION_DENIED",
  "HS_ORIGIN_NOT_ALLOWED",
  "HS_FEATURE_NOT_ENABLED",
  "HS_MAINNET_WRITES_DISABLED",

  // ── validation ────────────────────────────────────────────────────────────
  "HS_INVALID_REQUEST",
  "HS_INVALID_PARAMETER",
  "HS_MISSING_PARAMETER",
  "HS_UNSUPPORTED_VALUE",
  "HS_UNSUPPORTED_CHAIN",
  "HS_REQUEST_TOO_LARGE",

  // ── not found ─────────────────────────────────────────────────────────────
  "HS_RESOURCE_NOT_FOUND",
  "HS_PROJECT_NOT_FOUND",
  "HS_ENVIRONMENT_NOT_FOUND",

  // ── conflict ──────────────────────────────────────────────────────────────
  "HS_RESOURCE_CONFLICT",
  "HS_IDEMPOTENCY_KEY_REUSED",
  "HS_NONCE_CONFLICT",

  // ── precondition ──────────────────────────────────────────────────────────
  "HS_PRECONDITION_FAILED",
  "HS_CHAIN_MISMATCH",
  "HS_SIMULATION_FAILED",
  "HS_TRANSACTION_REVERTED",
  "HS_INSUFFICIENT_FUNDS",

  // ── limits, quota, and policy ─────────────────────────────────────────────
  "HS_RATE_LIMITED",
  "HS_QUOTA_EXCEEDED",
  "HS_GAS_POLICY_REJECTED",
  "HS_GAS_BUDGET_EXCEEDED",
  "HS_CREDIT_BALANCE_EXHAUSTED",

  // ── account abstraction ───────────────────────────────────────────────────
  "HS_USER_OPERATION_REJECTED",
  "HS_USER_OPERATION_TIMEOUT",

  // ── webhooks ──────────────────────────────────────────────────────────────
  "HS_WEBHOOK_SIGNATURE_INVALID",

  // ── upstream providers ────────────────────────────────────────────────────
  "HS_PROVIDER_ERROR",
  "HS_PROVIDER_UNSUPPORTED",
  "HS_PROVIDER_UNAVAILABLE",
  "HS_RPC_ERROR",
  "HS_RPC_UNAVAILABLE",
  "HS_BUNDLER_ERROR",
  "HS_PAYMASTER_ERROR",

  // ── timeouts ──────────────────────────────────────────────────────────────
  "HS_TIMEOUT",
  "HS_RECEIPT_TIMEOUT",

  // ── availability ──────────────────────────────────────────────────────────
  "HS_SERVICE_UNAVAILABLE",

  // ── fallback ──────────────────────────────────────────────────────────────
  "HS_INTERNAL_ERROR",
] as const;

export type HoodStackErrorCode = (typeof ERROR_CODES)[number];

export type HoodStackErrorCategory =
  | "authentication"
  | "authorization"
  | "validation"
  | "not_found"
  | "conflict"
  | "precondition"
  | "rate_limit"
  | "provider"
  | "timeout"
  | "unavailable"
  | "internal";

interface ErrorCodeMeta {
  readonly category: HoodStackErrorCategory;
  readonly httpStatus: number;
  /**
   * Whether retrying the *same* request may succeed without changing anything.
   *
   * This describes the error, not the operation. Callers must still refuse to
   * retry non-idempotent writes even when this is true - see `isRetryable`.
   */
  readonly retryable: boolean;
}

export const ERROR_CODE_META: Readonly<Record<HoodStackErrorCode, ErrorCodeMeta>> = {
  HS_AUTH_REQUIRED: { category: "authentication", httpStatus: 401, retryable: false },
  HS_INVALID_API_KEY: { category: "authentication", httpStatus: 401, retryable: false },
  HS_SESSION_EXPIRED: { category: "authentication", httpStatus: 401, retryable: false },
  HS_INVALID_SIGNATURE: { category: "authentication", httpStatus: 401, retryable: false },

  HS_PERMISSION_DENIED: { category: "authorization", httpStatus: 403, retryable: false },
  HS_ORIGIN_NOT_ALLOWED: { category: "authorization", httpStatus: 403, retryable: false },
  HS_FEATURE_NOT_ENABLED: {
    category: "authorization",
    httpStatus: 403,
    retryable: false,
  },
  HS_MAINNET_WRITES_DISABLED: {
    category: "authorization",
    httpStatus: 403,
    retryable: false,
  },

  HS_INVALID_REQUEST: { category: "validation", httpStatus: 400, retryable: false },
  HS_INVALID_PARAMETER: { category: "validation", httpStatus: 400, retryable: false },
  HS_MISSING_PARAMETER: { category: "validation", httpStatus: 400, retryable: false },
  HS_UNSUPPORTED_VALUE: { category: "validation", httpStatus: 400, retryable: false },
  HS_UNSUPPORTED_CHAIN: { category: "validation", httpStatus: 400, retryable: false },
  HS_REQUEST_TOO_LARGE: { category: "validation", httpStatus: 413, retryable: false },

  HS_RESOURCE_NOT_FOUND: { category: "not_found", httpStatus: 404, retryable: false },
  HS_PROJECT_NOT_FOUND: { category: "not_found", httpStatus: 404, retryable: false },
  HS_ENVIRONMENT_NOT_FOUND: { category: "not_found", httpStatus: 404, retryable: false },

  HS_RESOURCE_CONFLICT: { category: "conflict", httpStatus: 409, retryable: false },
  HS_IDEMPOTENCY_KEY_REUSED: { category: "conflict", httpStatus: 409, retryable: false },
  HS_NONCE_CONFLICT: { category: "conflict", httpStatus: 409, retryable: true },

  HS_PRECONDITION_FAILED: { category: "precondition", httpStatus: 412, retryable: false },
  HS_CHAIN_MISMATCH: { category: "precondition", httpStatus: 412, retryable: false },
  HS_SIMULATION_FAILED: { category: "precondition", httpStatus: 412, retryable: false },
  HS_TRANSACTION_REVERTED: {
    category: "precondition",
    httpStatus: 400,
    retryable: false,
  },
  HS_INSUFFICIENT_FUNDS: { category: "precondition", httpStatus: 400, retryable: false },

  HS_RATE_LIMITED: { category: "rate_limit", httpStatus: 429, retryable: true },
  HS_QUOTA_EXCEEDED: { category: "rate_limit", httpStatus: 429, retryable: false },
  HS_GAS_POLICY_REJECTED: {
    category: "authorization",
    httpStatus: 403,
    retryable: false,
  },
  HS_GAS_BUDGET_EXCEEDED: { category: "rate_limit", httpStatus: 429, retryable: false },
  HS_CREDIT_BALANCE_EXHAUSTED: {
    category: "rate_limit",
    httpStatus: 402,
    retryable: false,
  },

  HS_USER_OPERATION_REJECTED: {
    category: "precondition",
    httpStatus: 400,
    retryable: false,
  },
  HS_USER_OPERATION_TIMEOUT: { category: "timeout", httpStatus: 504, retryable: true },

  HS_WEBHOOK_SIGNATURE_INVALID: {
    category: "authentication",
    httpStatus: 401,
    retryable: false,
  },

  HS_PROVIDER_ERROR: { category: "provider", httpStatus: 502, retryable: true },
  HS_PROVIDER_UNSUPPORTED: { category: "provider", httpStatus: 501, retryable: false },
  HS_PROVIDER_UNAVAILABLE: { category: "unavailable", httpStatus: 503, retryable: true },
  HS_RPC_ERROR: { category: "provider", httpStatus: 502, retryable: true },
  HS_RPC_UNAVAILABLE: { category: "unavailable", httpStatus: 503, retryable: true },
  HS_BUNDLER_ERROR: { category: "provider", httpStatus: 502, retryable: true },
  HS_PAYMASTER_ERROR: { category: "provider", httpStatus: 502, retryable: true },

  HS_TIMEOUT: { category: "timeout", httpStatus: 504, retryable: true },
  HS_RECEIPT_TIMEOUT: { category: "timeout", httpStatus: 504, retryable: true },

  HS_SERVICE_UNAVAILABLE: { category: "unavailable", httpStatus: 503, retryable: true },

  HS_INTERNAL_ERROR: { category: "internal", httpStatus: 500, retryable: false },
};

export function isHoodStackErrorCode(value: unknown): value is HoodStackErrorCode {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(ERROR_CODE_META, value)
  );
}

/** Canonical origin used to build documentation links. */
export const DOCS_ORIGIN = "https://www.hoodstack.io";

/**
 * Documentation URL for an error code.
 *
 * Every error carries one so a developer hitting an unfamiliar code has a place
 * to go without searching.
 */
export function docsUrlForCode(code: HoodStackErrorCode): string {
  return `${DOCS_ORIGIN}/docs/errors#${code.toLowerCase()}`;
}
