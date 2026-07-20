import { isHoodStackError } from "@hoodstack/errors";
import { describe, expect, it, vi } from "vitest";

import { robinhoodTestnet } from "./chains.js";
import { checkChainHealth, checkRpcHealth } from "./health.js";
import { redactUrl, rpcRequest, rpcRequestWithFallback } from "./rpc.js";

const URL_A = "https://rpc-a.example.com";
const URL_B = "https://rpc-b.example.com";

/** Builds a fetch stub that replays a fixed sequence of responses. */
function stubFetch(...responses: Array<() => Response | Promise<Response>>) {
  let call = 0;
  return vi.fn(async () => {
    const next = responses[Math.min(call, responses.length - 1)];
    call += 1;
    return next!();
  }) as unknown as typeof globalThis.fetch;
}

const ok = (result: unknown) => () =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { status: 200 });

const serverError = () => () => new Response("upstream down", { status: 503 });

const rpcError = (code: number, message: string) => () =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code, message } }), {
    status: 200,
  });

describe("rpcRequest", () => {
  it("returns the JSON-RPC result", async () => {
    const fetchImpl = stubFetch(ok("0xb626"));
    await expect(
      rpcRequest(URL_A, "eth_chainId", [], { fetch: fetchImpl }),
    ).resolves.toBe("0xb626");
  });

  it("retries idempotent reads on a retryable failure", async () => {
    const fetchImpl = stubFetch(serverError(), ok("0x1"));
    const result = await rpcRequest(URL_A, "eth_blockNumber", [], {
      fetch: fetchImpl,
      retryBaseDelayMs: 1,
    });

    expect(result).toBe("0x1");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("never retries a transaction broadcast", async () => {
    // A broadcast can time out after the node accepted it. Retrying would risk
    // submitting the same transaction twice.
    const fetchImpl = stubFetch(serverError());

    await expect(
      rpcRequest(URL_A, "eth_sendRawTransaction", ["0xdead"], {
        fetch: fetchImpl,
        retries: 5,
        retryBaseDelayMs: 1,
      }),
    ).rejects.toThrow();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("stops retrying once attempts are exhausted", async () => {
    const fetchImpl = stubFetch(serverError());
    await expect(
      rpcRequest(URL_A, "eth_blockNumber", [], {
        fetch: fetchImpl,
        retries: 2,
        retryBaseDelayMs: 1,
      }),
    ).rejects.toThrow();

    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("maps HTTP 429 to a rate-limit error", async () => {
    const fetchImpl = stubFetch(() => new Response("slow down", { status: 429 }));
    const error = await rpcRequest(URL_A, "eth_chainId", [], {
      fetch: fetchImpl,
      retries: 0,
    }).catch((e: unknown) => e);

    expect(isHoodStackError(error) && error.code).toBe("HS_RATE_LIMITED");
  });

  it("surfaces JSON-RPC errors without retrying them", async () => {
    const fetchImpl = stubFetch(rpcError(-32000, "execution reverted"));
    const error = await rpcRequest(URL_A, "eth_call", [], {
      fetch: fetchImpl,
      retryBaseDelayMs: 1,
    }).catch((e: unknown) => e);

    expect(isHoodStackError(error) && error.code).toBe("HS_RPC_ERROR");
    expect((error as Error).message).toBe("execution reverted");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries the RPC codes that indicate a transient node condition", async () => {
    // -32005 is the common provider throttling code; unlike a revert, it can clear.
    const fetchImpl = stubFetch(rpcError(-32005, "request limit exceeded"), ok("0x1"));
    const result = await rpcRequest(URL_A, "eth_blockNumber", [], {
      fetch: fetchImpl,
      retryBaseDelayMs: 1,
    });

    expect(result).toBe("0x1");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("classifies throttling and internal node errors distinctly", async () => {
    const throttled = await rpcRequest(URL_A, "eth_call", [], {
      fetch: stubFetch(rpcError(-32005, "limit")),
      retries: 0,
    }).catch((e: unknown) => e);
    expect(isHoodStackError(throttled) && throttled.code).toBe("HS_RATE_LIMITED");

    const internal = await rpcRequest(URL_A, "eth_call", [], {
      fetch: stubFetch(rpcError(-32603, "internal")),
      retries: 0,
    }).catch((e: unknown) => e);
    expect(isHoodStackError(internal) && internal.code).toBe("HS_PROVIDER_ERROR");
  });
});

describe("redactUrl", () => {
  it("removes credentials that providers embed in the URL", () => {
    expect(redactUrl("https://rpc.example.com/v2/SECRET_KEY")).toBe(
      "https://rpc.example.com/v2/***",
    );
    expect(redactUrl("https://rpc.example.com/?apiKey=SECRET")).not.toContain("SECRET");
    expect(redactUrl("https://user:pass@rpc.example.com/")).not.toContain("pass");
  });

  it("does not throw on malformed input", () => {
    expect(redactUrl("not a url")).toBe("[unparseable-url]");
  });

  it("keeps secrets out of error details", async () => {
    const fetchImpl = stubFetch(serverError());
    const error = await rpcRequest(
      "https://rpc.example.com/v2/SECRET_KEY",
      "eth_chainId",
      [],
      {
        fetch: fetchImpl,
        retries: 0,
      },
    ).catch((e: unknown) => e);

    expect(JSON.stringify(isHoodStackError(error) && error.toJSON())).not.toContain(
      "SECRET_KEY",
    );
  });
});

describe("rpcRequestWithFallback", () => {
  it("moves to the next endpoint when one fails", async () => {
    const fetchImpl = stubFetch(serverError(), ok("0xb626"));
    const result = await rpcRequestWithFallback([URL_A, URL_B], "eth_chainId", [], {
      fetch: fetchImpl,
      retries: 0,
    });

    expect(result).toBe("0xb626");
  });

  it("reports HS_RPC_UNAVAILABLE when every endpoint fails", async () => {
    const fetchImpl = stubFetch(serverError());
    const error = await rpcRequestWithFallback([URL_A, URL_B], "eth_chainId", [], {
      fetch: fetchImpl,
      retries: 0,
    }).catch((e: unknown) => e);

    expect(isHoodStackError(error) && error.code).toBe("HS_RPC_UNAVAILABLE");
  });

  it("refuses to fail over a write", async () => {
    // Failing a write over to a second node could broadcast it twice.
    const fetchImpl = stubFetch(ok("0x0"));
    const error = await rpcRequestWithFallback(
      [URL_A, URL_B],
      "eth_sendRawTransaction",
      ["0xdead"],
      { fetch: fetchImpl },
    ).catch((e: unknown) => e);

    expect(isHoodStackError(error) && error.code).toBe("HS_INVALID_REQUEST");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("requires at least one endpoint", async () => {
    await expect(rpcRequestWithFallback([], "eth_chainId")).rejects.toThrow();
  });
});

describe("checkRpcHealth", () => {
  it("reports a healthy endpoint with latency", async () => {
    const fetchImpl = stubFetch(ok("0xb626"), ok("0x2a"));
    const report = await checkRpcHealth(URL_A, {
      fetch: fetchImpl,
      expectedChainId: 46630,
    });

    expect(report.healthy).toBe(true);
    expect(report.chainId).toBe(46630);
    expect(report.blockNumber).toBe(42n);
    expect(report.chainIdMatches).toBe(true);
    expect(report.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("treats a wrong chain ID as unhealthy", async () => {
    // Reachable but serving another network is worse than an outage: reads
    // succeed while returning data from the wrong chain.
    const fetchImpl = stubFetch(ok("0x1"), ok("0x2a"));
    const report = await checkRpcHealth(URL_A, {
      fetch: fetchImpl,
      expectedChainId: 46630,
    });

    expect(report.chainIdMatches).toBe(false);
    expect(report.healthy).toBe(false);
  });

  it("never throws on an unreachable endpoint", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof globalThis.fetch;

    const report = await checkRpcHealth(URL_A, { fetch: fetchImpl });

    expect(report.healthy).toBe(false);
    expect(report.error?.code).toBe("HS_PROVIDER_UNAVAILABLE");
  });

  it("redacts the endpoint it reports on", async () => {
    const fetchImpl = stubFetch(ok("0xb626"), ok("0x1"));
    const report = await checkRpcHealth("https://rpc.example.com/v2/SECRET", {
      fetch: fetchImpl,
    });

    expect(report.endpoint).not.toContain("SECRET");
  });
});

describe("checkChainHealth", () => {
  it("is healthy when at least one endpoint serves the right chain", async () => {
    const fetchImpl = stubFetch(ok("0xb626"), ok("0x2a"));
    const report = await checkChainHealth(robinhoodTestnet, {
      fetch: fetchImpl,
      rpcUrls: [URL_A],
    });

    expect(report.chainId).toBe(46630);
    expect(report.network).toBe("robinhood-testnet");
    expect(report.healthy).toBe(true);
    expect(report.endpoints).toHaveLength(1);
  });
});
