export {
  ERROR_CODES,
  ERROR_CODE_META,
  DOCS_ORIGIN,
  docsUrlForCode,
  isHoodStackErrorCode,
  type HoodStackErrorCode,
  type HoodStackErrorCategory,
} from "./codes.js";

export {
  HoodStackError,
  isHoodStackError,
  isRetryable,
  type HoodStackErrorOptions,
  type HoodStackErrorJSON,
} from "./error.js";

export { normalizeError } from "./normalize.js";
export { redactDetails, REDACTED } from "./redact.js";
