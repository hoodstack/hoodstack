import { HoodStackError } from "@hoodstack/errors";

/**
 * HoodStack SDK.
 *
 * A small, typed client over the HoodStack REST API. It handles auth, the
 * response envelope, and errors, so callers work with plain typed results and
 * catch `HoodStackError` with a stable `HS_` code. Transient failures are
 * retried with jittered backoff (honoring `Retry-After`), and concurrent
 * identical reads are coalesced onto one round-trip. No heavy dependencies: it
 * needs only `fetch`, native in Node 18+ and every browser.
 */

const DEFAULT_BASE_URL = "https://www.hoodstack.io";

export interface HoodStackClientOptions {
  /** A project API key, `hs_live_…` or `hs_test_…`. */
  apiKey: string;
  /** Override the API origin. Defaults to https://www.hoodstack.io. */
  baseUrl?: string;
  /** Injectable fetch, for tests or a custom runtime. */
  fetch?: typeof globalThis.fetch;
  /** Per-request timeout in milliseconds. Defaults to 15000. */
  timeoutMs?: number;
  /**
   * Retries for transient failures (network errors, timeouts, and retryable API
   * errors like rate limits). Backoff is exponential with jitter and honors a
   * `Retry-After` header. Only idempotent reads are retried. Defaults to 2; set
   * 0 to disable.
   */
  maxRetries?: number;
  /** Base backoff delay in milliseconds, doubled per attempt. Defaults to 200. */
  retryBaseMs?: number;
}

export interface HealthData {
  status: string;
  project: { id: string; name: string };
  environment: "live" | "test";
  chain: { id: number; name: string };
  time: string;
}

export interface AccountSummary {
  address: string;
  chainId: number;
  balanceWei: string;
  balanceFormatted: string;
  nonce: number;
  isContract: boolean;
}

export interface TransactionSummary {
  hash: string;
  found: boolean;
  status: "success" | "reverted" | "pending" | null;
  from: string | null;
  to: string | null;
  valueWei: string | null;
  valueFormatted: string | null;
  blockNumber: number | null;
  gasUsed: string | null;
}

export interface BlockSummary {
  number: number;
  hash: string;
  timestamp: string;
  transactionCount: number;
  gasUsed: string;
  gasLimit: string;
}

export interface TokenSummary {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  totalSupplyFormatted: string;
  holder: string | null;
  holderBalance: string | null;
  holderBalanceFormatted: string | null;
}

export interface GasSummary {
  gasPriceWei: string;
  gasPriceGwei: string;
  baseFeeWei: string | null;
  transferCostWei: string;
  transferCostFormatted: string;
}

export interface SimulationResult {
  success: boolean;
  gasEstimate: string | null;
  returnData: string | null;
  revertReason: string | null;
}

export interface RpcResult<T = unknown> {
  chainId: number;
  method: string;
  result: T;
}

export interface SimulateInput {
  to: string;
  from?: string;
  valueWei?: string;
  data?: string;
}

type Query = Record<string, string | number | undefined>;

/**
 * A client bound to one project API key. The `data` and `tx` namespaces group
 * related reads; every method resolves to typed data or throws a HoodStackError.
 */
export class HoodStackClient {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #fetch: typeof globalThis.fetch;
  readonly #timeoutMs: number;
  readonly #maxRetries: number;
  readonly #retryBaseMs: number;
  /** In-flight GET reads, so concurrent identical requests share one round-trip. */
  readonly #inflight = new Map<string, Promise<unknown>>();

  constructor(options: HoodStackClientOptions) {
    if (!options.apiKey) throw new Error("HoodStackClient requires an apiKey.");
    this.#apiKey = options.apiKey;
    this.#baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.#fetch = options.fetch ?? globalThis.fetch;
    this.#timeoutMs = options.timeoutMs ?? 15_000;
    this.#maxRetries = Math.max(0, options.maxRetries ?? 2);
    this.#retryBaseMs = Math.max(0, options.retryBaseMs ?? 200);
  }

  /** Verify the key and report the chain it acts against. */
  health(): Promise<HealthData> {
    return this.#request<HealthData>("GET", "/api/v1/health");
  }

  /** Current gas price and base fee. */
  gas(): Promise<GasSummary> {
    return this.#request<GasSummary>("GET", "/api/v1/gas");
  }

  /** A read-only JSON-RPC call. Only idempotent methods are permitted. */
  rpc<T = unknown>(method: string, params: readonly unknown[] = []): Promise<RpcResult<T>> {
    return this.#request<RpcResult<T>>("POST", "/api/v1/rpc", { body: { method, params } });
  }

  readonly data = {
    account: (address: string): Promise<AccountSummary> =>
      this.#request("GET", "/api/v1/data/account", { query: { address } }),
    transaction: (hash: string): Promise<TransactionSummary> =>
      this.#request("GET", "/api/v1/data/transaction", { query: { hash } }),
    block: (number: number | "latest" = "latest"): Promise<BlockSummary> =>
      this.#request("GET", "/api/v1/data/block", { query: { number: String(number) } }),
    token: (address: string, holder?: string): Promise<TokenSummary> =>
      this.#request("GET", "/api/v1/data/token", { query: { address, holder } }),
  };

  readonly tx = {
    simulate: (input: SimulateInput): Promise<SimulationResult> =>
      this.#request("POST", "/api/v1/tx/simulate", { body: input }),
  };

  #request<T>(
    method: "GET" | "POST",
    path: string,
    options: { query?: Query; body?: unknown } = {},
  ): Promise<T> {
    const url = new URL(this.#baseUrl + path);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
      }
    }
    const target = url.toString();
    const body =
      options.body !== undefined ? JSON.stringify(options.body) : undefined;

    // Coalesce concurrent identical GET reads onto one round-trip. POSTs (rpc,
    // simulate) are never coalesced, since callers may want independent calls.
    if (method === "GET") {
      const existing = this.#inflight.get(target);
      if (existing) return existing as Promise<T>;
      const shared = this.#execute<T>(method, target, body);
      this.#inflight.set(target, shared);
      void shared.catch(() => {}).finally(() => this.#inflight.delete(target));
      return shared;
    }
    return this.#execute<T>(method, target, body);
  }

  /** Fetch with a timeout and bounded retry for transient failures. */
  async #execute<T>(method: string, url: string, body: string | undefined): Promise<T> {
    const headers: Record<string, string> = { authorization: `Bearer ${this.#apiKey}` };
    if (body !== undefined) headers["content-type"] = "application/json";

    for (let attempt = 0; ; attempt++) {
      let response: Response;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.#timeoutMs);
        const init: RequestInit = { method, headers, signal: controller.signal };
        if (body !== undefined) init.body = body;
        try {
          response = await this.#fetch(url, init);
        } finally {
          clearTimeout(timer);
        }
      } catch (error) {
        // Network error or timeout: transient, so retry within budget.
        if (attempt < this.#maxRetries) {
          await this.#backoff(attempt);
          continue;
        }
        const aborted = error instanceof Error && error.name === "AbortError";
        throw new HoodStackError("HS_PROVIDER_UNAVAILABLE", {
          message: aborted ? "The request timed out." : "Could not reach the HoodStack API.",
          cause: error,
          retryable: true,
        });
      }

      const json = (await response.json().catch(() => null)) as
        | { ok?: boolean; data?: unknown; error?: unknown }
        | null;

      if (!json || typeof json !== "object") {
        throw new HoodStackError("HS_INTERNAL_ERROR", {
          message: "The API returned a malformed response.",
          details: { status: response.status },
        });
      }
      if (json.ok === true) return json.data as T;

      const error = HoodStackError.fromJSON(json.error ?? json);
      if (error.retryable && attempt < this.#maxRetries) {
        await this.#backoff(attempt, response);
        continue;
      }
      throw error;
    }
  }

  /** Exponential backoff with jitter, capped, honoring a `Retry-After` header. */
  #backoff(attempt: number, response?: Response): Promise<void> {
    const capped = Math.min(this.#retryBaseMs * 2 ** attempt, 4_000);
    let delay = capped / 2 + Math.random() * (capped / 2);
    const retryAfter = response?.headers.get("retry-after");
    if (retryAfter) {
      const seconds = Number(retryAfter);
      if (Number.isFinite(seconds) && seconds >= 0) delay = Math.min(seconds * 1_000, 10_000);
    }
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/** Convenience factory. Equivalent to `new HoodStackClient(options)`. */
export function createClient(options: HoodStackClientOptions): HoodStackClient {
  return new HoodStackClient(options);
}

export { HoodStackError, isHoodStackError } from "@hoodstack/errors";
