import { HoodStackError, isHoodStackError, normalizeError } from "@hoodstack/errors";

/**
 * Minimal JSON-RPC client with timeout, bounded retry, and endpoint fallback.
 *
 * This is not a replacement for viem's transports - it exists for the paths that
 * must not depend on a full client: health checks, CLI diagnostics, and reading
 * from an endpoint before a chain has been validated.
 */

/**
 * JSON-RPC methods that are safe to retry.
 *
 * Retrying is only sound for reads. `eth_sendRawTransaction` is deliberately
 * absent: a request can time out after the node accepted it, so a retry can
 * broadcast a second transaction. Anything not on this list gets zero retries,
 * regardless of what the caller asks for.
 */
const IDEMPOTENT_METHODS: ReadonlySet<string> = new Set([
  "eth_chainId",
  "eth_blockNumber",
  "eth_getBalance",
  "eth_getCode",
  "eth_getStorageAt",
  "eth_getTransactionCount",
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "eth_getBlockByNumber",
  "eth_getBlockByHash",
  "eth_call",
  "eth_estimateGas",
  "eth_gasPrice",
  "eth_maxPriorityFeePerGas",
  "eth_feeHistory",
  "eth_getLogs",
  "net_version",
  "web3_clientVersion",
]);

export interface RpcRequestOptions {
  /** Per-attempt timeout in milliseconds. Defaults to 10000. */
  readonly timeoutMs?: number;
  /** Retry attempts after the first. Ignored for non-idempotent methods. */
  readonly retries?: number;
  /** Base backoff delay in milliseconds. Defaults to 250. */
  readonly retryBaseDelayMs?: number;
  /** Caller cancellation, combined with the internal timeout. */
  readonly signal?: AbortSignal;
  /** Injectable for testing and for runtimes with a custom fetch. */
  readonly fetch?: typeof globalThis.fetch;
  readonly headers?: Readonly<Record<string, string>>;
}

interface JsonRpcSuccess<T> {
  jsonrpc: "2.0";
  id: number;
  result: T;
}

interface JsonRpcFailure {
  jsonrpc: "2.0";
  id: number;
  error: { code: number; message: string; data?: unknown };
}

let requestId = 0;

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new HoodStackError("HS_TIMEOUT", { message: "Retry wait was aborted." }));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Combines the caller's signal with a per-attempt timeout. */
function withTimeout(
  timeoutMs: number,
  signal: AbortSignal | undefined,
): { signal: AbortSignal; dispose: () => void } {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!signal) return { signal: timeout, dispose: () => {} };

  // AbortSignal.any is available in Node 20+ and current browsers.
  if (typeof AbortSignal.any === "function") {
    return { signal: AbortSignal.any([signal, timeout]), dispose: () => {} };
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  timeout.addEventListener("abort", abort, { once: true });
  return {
    signal: controller.signal,
    dispose: () => {
      signal.removeEventListener("abort", abort);
      timeout.removeEventListener("abort", abort);
    },
  };
}

function errorForHttpStatus(status: number, url: string, body: string): HoodStackError {
  const details = { status, endpoint: redactUrl(url), body: body.slice(0, 512) };

  if (status === 429) {
    return new HoodStackError("HS_RATE_LIMITED", {
      message:
        "The RPC endpoint rate-limited this request. Public Robinhood Chain " +
        "endpoints are rate-limited and are not suitable for production traffic.",
      details,
    });
  }
  if (status >= 500) {
    return new HoodStackError("HS_PROVIDER_ERROR", {
      message: `RPC endpoint returned HTTP ${status}.`,
      details,
    });
  }
  return new HoodStackError("HS_RPC_ERROR", {
    message: `RPC endpoint returned HTTP ${status}.`,
    details,
  });
}

/**
 * Strips credentials from an endpoint URL before it goes into an error.
 *
 * Provider RPC URLs routinely embed an API key in the path or query string, and
 * errors get logged.
 */
export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.username = "";
    parsed.password = "";
    parsed.search = "";
    // The last path segment is where most providers put the project key.
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      segments[segments.length - 1] = "***";
      parsed.pathname = `/${segments.join("/")}`;
    }
    return parsed.toString();
  } catch {
    return "[unparseable-url]";
  }
}

/**
 * Maps a JSON-RPC error object to a HoodStack error.
 *
 * Most JSON-RPC errors are deterministic: a revert, bad params, or an unknown
 * method returns the same result no matter how many times it is sent. Retrying
 * them burns request quota and delays the failure the caller needs to see. Only
 * the codes that genuinely indicate a transient node condition are retryable.
 */
function errorForRpcError(
  rpcError: { code: number; message: string },
  method: string,
  url: string,
): HoodStackError {
  const details = { rpcErrorCode: rpcError.code, method, endpoint: redactUrl(url) };

  // -32005: request limit exceeded (the common provider throttling code).
  if (rpcError.code === -32005) {
    return new HoodStackError("HS_RATE_LIMITED", { message: rpcError.message, details });
  }

  // -32603: internal node error, which may clear on its own.
  if (rpcError.code === -32603) {
    return new HoodStackError("HS_PROVIDER_ERROR", {
      message: rpcError.message,
      details,
    });
  }

  return new HoodStackError("HS_RPC_ERROR", {
    message: rpcError.message,
    details,
    retryable: false,
  });
}

async function attempt<T>(
  url: string,
  method: string,
  params: readonly unknown[],
  options: RpcRequestOptions,
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const doFetch = options.fetch ?? globalThis.fetch;
  const { signal, dispose } = withTimeout(timeoutMs, options.signal);

  try {
    const response = await doFetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...options.headers },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++requestId, method, params }),
      signal,
    });

    if (!response.ok) {
      throw errorForHttpStatus(
        response.status,
        url,
        await response.text().catch(() => ""),
      );
    }

    const payload = (await response.json()) as JsonRpcSuccess<T> | JsonRpcFailure;

    if ("error" in payload) throw errorForRpcError(payload.error, method, url);

    return payload.result;
  } catch (error) {
    // AbortSignal.timeout raises TimeoutError, not AbortError.
    if ((error as { name?: string } | null)?.name === "TimeoutError") {
      throw new HoodStackError("HS_TIMEOUT", {
        message: `RPC request "${method}" exceeded ${timeoutMs}ms.`,
        details: { method, timeoutMs, endpoint: redactUrl(url) },
        cause: error,
      });
    }
    throw normalizeError(error, "HS_RPC_ERROR");
  } finally {
    dispose();
  }
}

/**
 * Performs a JSON-RPC call against a single endpoint.
 *
 * Retries are applied only to methods on the idempotent safelist, with
 * exponential backoff plus jitter to avoid synchronized retry storms.
 */
export async function rpcRequest<T = unknown>(
  url: string,
  method: string,
  params: readonly unknown[] = [],
  options: RpcRequestOptions = {},
): Promise<T> {
  const idempotent = IDEMPOTENT_METHODS.has(method);
  const maxRetries = idempotent ? (options.retries ?? 2) : 0;
  const baseDelay = options.retryBaseDelayMs ?? 250;

  let lastError: unknown;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await attempt<T>(url, method, params, options);
    } catch (error) {
      lastError = error;

      const retryable =
        isHoodStackError(error) &&
        error.retryable &&
        error.code !== "HS_INVALID_REQUEST" &&
        i < maxRetries;

      if (!retryable) break;

      const jitter = Math.random() * baseDelay;
      await delay(baseDelay * 2 ** i + jitter, options.signal);
    }
  }

  throw lastError;
}

/**
 * Performs a read against a list of endpoints, moving to the next on failure.
 *
 * Only safe for idempotent reads, and enforced as such - a fallback on a write
 * would submit the same transaction to two different nodes.
 */
export async function rpcRequestWithFallback<T = unknown>(
  urls: readonly string[],
  method: string,
  params: readonly unknown[] = [],
  options: RpcRequestOptions = {},
): Promise<T> {
  if (urls.length === 0) {
    throw new HoodStackError("HS_INVALID_PARAMETER", {
      message: "At least one RPC endpoint is required.",
    });
  }

  if (!IDEMPOTENT_METHODS.has(method)) {
    throw new HoodStackError("HS_INVALID_REQUEST", {
      message:
        `"${method}" is not a read method, so it cannot be sent with endpoint ` +
        "fallback. Failing over a write risks submitting it more than once.",
      details: { method },
    });
  }

  const failures: unknown[] = [];

  for (const url of urls) {
    try {
      return await rpcRequest<T>(url, method, params, options);
    } catch (error) {
      failures.push(error);
      // A caller-initiated abort is not an endpoint failure; stop immediately.
      if (options.signal?.aborted) throw error;
    }
  }

  throw new HoodStackError("HS_RPC_UNAVAILABLE", {
    message: `All ${urls.length} RPC endpoint(s) failed for "${method}".`,
    details: {
      method,
      endpoints: urls.map(redactUrl),
      failures: failures.map((error) =>
        isHoodStackError(error) ? error.toJSON() : String(error),
      ),
    },
    cause: failures[0],
  });
}

export { IDEMPOTENT_METHODS };
