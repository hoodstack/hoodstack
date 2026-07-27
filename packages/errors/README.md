# @hoodstack/errors

The error taxonomy for [HoodStack](https://www.hoodstack.io), the developer
infrastructure stack for Robinhood Chain.

Every error is a `HoodStackError` with a stable `HS_` code, an HTTP status, a
retryable flag, and a documentation link. Branch on the code, not on a parsed
message.

## Install

```bash
npm install @hoodstack/errors
```

## Usage

```ts
import { HoodStackError, isHoodStackError } from "@hoodstack/errors";

try {
  await doSomething();
} catch (error) {
  if (isHoodStackError(error)) {
    error.code; // "HS_INVALID_API_KEY" | "HS_RATE_LIMITED" | ...
    error.category; // "authentication" | "rate_limit" | ...
    error.httpStatus; // 401, 429, ...
    error.retryable; // whether retrying may help
    error.docsUrl; // where to read more
    error.requestId; // correlate with server logs, when present
  }
}
```

## Constructing errors

```ts
throw new HoodStackError("HS_INVALID_PARAMETER", {
  message: "`address` is not a valid address.",
  details: { address }, // redacted at construction; secrets never reach a log
});
```

## Over the wire

Errors serialize to a stable JSON shape and rebuild from it, so a client can
reconstruct the same typed error a server threw.

```ts
const json = error.toJSON(); // { code, category, message, retryable, docsUrl, ... }
const rebuilt = HoodStackError.fromJSON(json);
```

## Exports

- `HoodStackError`, `isHoodStackError`, `isRetryable`
- `ERROR_CODES`, `ERROR_CODE_META`, `isHoodStackErrorCode`, `docsUrlForCode`
- `normalizeError` (coerce any thrown value into a `HoodStackError`)
- `redactDetails`, `REDACTED`
- Types: `HoodStackErrorCode`, `HoodStackErrorCategory`, `HoodStackErrorOptions`,
  `HoodStackErrorJSON`

## License

Apache-2.0
