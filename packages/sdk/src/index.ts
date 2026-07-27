import { HoodStackError } from "@hoodstack/errors";

/**
 * HoodStack SDK.
 *
 * A small, typed client over the HoodStack REST API. It handles auth, the
 * response envelope, and errors, so callers work with plain typed results and
 * catch `HoodStackError` with a stable `HS_` code. No heavy dependencies: it
 * needs only `fetch`, which is native in Node 18+ and every browser.
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

  constructor(options: HoodStackClientOptions) {
    if (!options.apiKey) throw new Error("HoodStackClient requires an apiKey.");
    this.#apiKey = options.apiKey;
    this.#baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.#fetch = options.fetch ?? globalThis.fetch;
    this.#timeoutMs = options.timeoutMs ?? 15_000;
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

  async #request<T>(
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

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.#timeoutMs);

    const headers: Record<string, string> = {
      authorization: `Bearer ${this.#apiKey}`,
    };
    const init: RequestInit = { method, headers, signal: controller.signal };
    if (options.body !== undefined) {
      headers["content-type"] = "application/json";
      init.body = JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await this.#fetch(url.toString(), init);
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      throw new HoodStackError("HS_PROVIDER_UNAVAILABLE", {
        message: aborted ? "The request timed out." : "Could not reach the HoodStack API.",
        cause: error,
        retryable: true,
      });
    } finally {
      clearTimeout(timer);
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
    throw HoodStackError.fromJSON(json.error ?? json);
  }
}

/** Convenience factory. Equivalent to `new HoodStackClient(options)`. */
export function createClient(options: HoodStackClientOptions): HoodStackClient {
  return new HoodStackClient(options);
}

export { HoodStackError, isHoodStackError } from "@hoodstack/errors";
