import {
  ERROR_CODE_META,
  docsUrlForCode,
  isHoodStackErrorCode,
  type HoodStackErrorCategory,
  type HoodStackErrorCode,
} from "./codes.js";
import { redactDetails } from "./redact.js";

/**
 * Brand used by {@link isHoodStackError}.
 *
 * `instanceof` is unreliable here: the SDK, the server package, and the app can
 * each resolve a different copy of this module (dual ESM/CJS, pnpm isolation,
 * bundler duplication). A symbol-keyed brand identifies our errors regardless.
 */
const HOODSTACK_ERROR_BRAND = Symbol.for("hoodstack.error");

const captureStackTrace = (
  Error as unknown as {
    captureStackTrace?: (target: object, constructorOpt?: unknown) => void;
  }
).captureStackTrace;

export interface HoodStackErrorOptions {
  /**
   * Human-readable and safe to return to a caller.
   *
   * Must never contain a stack trace, SQL, a provider key, an internal
   * hostname, another tenant's data, or a raw sensitive payload.
   */
  message?: string;
  /** Structured context. Redacted at construction - see `redactDetails`. */
  details?: Record<string, unknown>;
  cause?: unknown;
  /** Correlates this error with a server-side request log. */
  requestId?: string;
  /** Overrides the code's default retryability. */
  retryable?: boolean;
  /** Hint from the server (e.g. a `Retry-After` header), in milliseconds. */
  retryAfterMs?: number;
  /** Overrides the documentation link derived from the code. */
  docsUrl?: string;
}

/**
 * Wire representation, as returned by the API and carried in webhook payloads.
 *
 * Deliberately excludes `cause` and `stack`. Those are for server-side logs; a
 * stack trace in an API response leaks file paths and internal structure.
 */
export interface HoodStackErrorJSON {
  code: HoodStackErrorCode;
  category: HoodStackErrorCategory;
  message: string;
  retryable: boolean;
  docsUrl: string;
  details?: Record<string, unknown>;
  requestId?: string;
  retryAfterMs?: number;
}

const DEFAULT_MESSAGES: Partial<Record<HoodStackErrorCode, string>> = {
  HS_AUTH_REQUIRED: "Authentication is required for this request.",
  HS_INVALID_API_KEY: "The provided API key is invalid or has been revoked.",
  HS_SESSION_EXPIRED: "This session has expired. Sign in again.",
  HS_ORIGIN_NOT_ALLOWED:
    "This origin is not in the project's allowed origins. Add it in project settings.",
  HS_MAINNET_WRITES_DISABLED:
    "Mainnet writes are disabled. Enable them explicitly for this project before " +
    "submitting mainnet transactions.",
  HS_FEATURE_NOT_ENABLED: "This module is not enabled for the current project.",
  HS_CHAIN_MISMATCH: "The connected chain does not match the chain this request targets.",
  HS_RATE_LIMITED: "Too many requests. Retry after the indicated delay.",
  HS_CREDIT_BALANCE_EXHAUSTED:
    "This project has no remaining usage credits for the requested operation.",
  HS_WEBHOOK_SIGNATURE_INVALID:
    "The webhook signature did not verify. The payload may have been altered, " +
    "replayed, or signed with a rotated secret.",
  HS_INTERNAL_ERROR: "An unexpected error occurred.",
};

/**
 * The single error type crossing HoodStack package boundaries.
 *
 * Adapters normalize provider-specific failures into this shape so callers can
 * branch on a stable `code` rather than parsing upstream error strings.
 */
export class HoodStackError extends Error {
  readonly [HOODSTACK_ERROR_BRAND] = true as const;

  readonly code: HoodStackErrorCode;
  readonly category: HoodStackErrorCategory;
  readonly httpStatus: number;
  readonly retryable: boolean;
  readonly docsUrl: string;
  readonly details: Record<string, unknown> | undefined;
  readonly requestId: string | undefined;
  readonly retryAfterMs: number | undefined;

  constructor(code: HoodStackErrorCode, options: HoodStackErrorOptions = {}) {
    const meta = ERROR_CODE_META[code];
    super(
      options.message ?? DEFAULT_MESSAGES[code] ?? code,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );

    this.name = "HoodStackError";
    this.code = code;
    this.category = meta.category;
    this.httpStatus = meta.httpStatus;
    this.retryable = options.retryable ?? meta.retryable;
    this.docsUrl = options.docsUrl ?? docsUrlForCode(code);
    this.details = options.details ? redactDetails(options.details) : undefined;
    this.requestId = options.requestId;
    this.retryAfterMs = options.retryAfterMs;

    // Keep the constructor frame out of the stack trace. V8-only, and this
    // package ships to browsers as well as Node, so it is feature-detected.
    captureStackTrace?.(this, HoodStackError);
  }

  /** Returns a copy carrying a request ID, for tagging at the API boundary. */
  withRequestId(requestId: string): HoodStackError {
    const options: HoodStackErrorOptions = {
      message: this.message,
      retryable: this.retryable,
      docsUrl: this.docsUrl,
      requestId,
    };
    if (this.details) options.details = this.details;
    if (this.retryAfterMs !== undefined) options.retryAfterMs = this.retryAfterMs;
    if (this.cause !== undefined) options.cause = this.cause;

    return new HoodStackError(this.code, options);
  }

  toJSON(): HoodStackErrorJSON {
    const json: HoodStackErrorJSON = {
      code: this.code,
      category: this.category,
      message: this.message,
      retryable: this.retryable,
      docsUrl: this.docsUrl,
    };
    if (this.details) json.details = this.details;
    if (this.requestId) json.requestId = this.requestId;
    if (this.retryAfterMs !== undefined) json.retryAfterMs = this.retryAfterMs;
    return json;
  }

  /** Rebuilds an error received over the wire, e.g. in the SDK. */
  static fromJSON(input: unknown): HoodStackError {
    if (typeof input !== "object" || input === null) {
      return new HoodStackError("HS_INTERNAL_ERROR", {
        message: "Malformed error response.",
        details: { received: typeof input },
      });
    }

    const raw = input as Record<string, unknown>;
    const code = isHoodStackErrorCode(raw["code"]) ? raw["code"] : "HS_INTERNAL_ERROR";

    const options: HoodStackErrorOptions = {};
    if (typeof raw["message"] === "string") options.message = raw["message"];
    if (typeof raw["requestId"] === "string") options.requestId = raw["requestId"];
    if (typeof raw["retryable"] === "boolean") options.retryable = raw["retryable"];
    if (typeof raw["retryAfterMs"] === "number") {
      options.retryAfterMs = raw["retryAfterMs"];
    }
    if (typeof raw["docsUrl"] === "string") options.docsUrl = raw["docsUrl"];
    if (typeof raw["details"] === "object" && raw["details"] !== null) {
      options.details = raw["details"] as Record<string, unknown>;
    }

    return new HoodStackError(code, options);
  }
}

export function isHoodStackError(value: unknown): value is HoodStackError {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<symbol, unknown>)[HOODSTACK_ERROR_BRAND] === true
  );
}

/**
 * Whether a failed call is safe to retry automatically.
 *
 * `idempotent` defaults to `false` deliberately. Blindly retrying a write can
 * submit a transaction twice; callers must opt in by asserting the operation is
 * idempotent (typically by supplying an idempotency key).
 */
export function isRetryable(error: unknown, idempotent = false): boolean {
  if (!isHoodStackError(error)) return false;
  if (!error.retryable) return false;
  if (error.category === "rate_limit" || error.category === "unavailable") return true;
  return idempotent;
}
