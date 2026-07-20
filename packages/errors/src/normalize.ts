import type { HoodStackErrorCode } from "./codes.js";
import { HoodStackError, isHoodStackError } from "./error.js";

function isAbort(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

/**
 * `fetch` reports every transport-level failure - DNS, TLS, refused connection,
 * offline - as a bare `TypeError`. There is no structured discriminator, so the
 * message is the only signal available.
 */
function isTransportFailure(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false;
  return /fetch failed|network|load failed|ECONN|ENOTFOUND|EAI_AGAIN/i.test(
    error.message,
  );
}

/**
 * Converts any thrown value into a {@link HoodStackError}.
 *
 * Adapters call this at their boundary so that a provider SDK's error shape never
 * escapes into HoodStack code. The original value is preserved as `cause` so the
 * underlying failure remains debuggable.
 */
export function normalizeError(
  error: unknown,
  fallbackCode: HoodStackErrorCode = "HS_INTERNAL_ERROR",
): HoodStackError {
  if (isHoodStackError(error)) return error;

  if (isAbort(error)) {
    return new HoodStackError("HS_TIMEOUT", {
      message: "The request was aborted before it completed.",
      cause: error,
    });
  }

  if (isTransportFailure(error)) {
    return new HoodStackError("HS_PROVIDER_UNAVAILABLE", {
      message: "Could not reach the upstream provider.",
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new HoodStackError(fallbackCode, { message: error.message, cause: error });
  }

  if (typeof error === "string" && error.length > 0) {
    return new HoodStackError(fallbackCode, { message: error });
  }

  return new HoodStackError(fallbackCode, {
    message: "An unknown error occurred.",
    details: { thrownType: typeof error },
    cause: error,
  });
}
