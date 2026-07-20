/**
 * Redaction for error details.
 *
 * Errors travel to logs, monitoring providers, webhook payloads, and API
 * responses. Anything attached to an error must be assumed to be persisted
 * somewhere we do not control, so secrets are stripped at construction time
 * rather than at each egress point.
 */

const SENSITIVE_KEY_PATTERN =
  /(pass(word|phrase)?|secret|token|api[-_]?key|authorization|cookie|session|private[-_]?key|privkey|mnemonic|seed|signature|credential|bearer|salt|otp|nonce[-_]?secret)/i;

export const REDACTED = "[redacted]";

/** Values that survive redaction untouched. */
function isScalar(value: unknown): boolean {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  );
}

/**
 * Recursively redacts values whose key looks sensitive.
 *
 * Cycles are broken with a seen-set, and depth is bounded, because error details
 * frequently contain provider response objects of unknown shape.
 */
export function redactDetails(
  input: Record<string, unknown>,
  maxDepth = 6,
): Record<string, unknown> {
  return redactValue(input, maxDepth, new WeakSet()) as Record<string, unknown>;
}

function redactValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (isScalar(value) || value === undefined) return value;

  if (depth <= 0) return "[truncated]";

  // `isScalar` already excluded null, but that guard does not narrow `unknown`,
  // and `typeof null === "object"`.
  if (typeof value === "object" && value !== null) {
    if (seen.has(value)) return "[circular]";
    seen.add(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth - 1, seen));
  }

  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? REDACTED
        : redactValue(item, depth - 1, seen);
    }
    return out;
  }

  // functions, symbols - never useful in a serialized error
  return undefined;
}
