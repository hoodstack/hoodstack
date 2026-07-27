import { isHoodStackError } from "@hoodstack/errors";
import { describe, expect, it, vi } from "vitest";

import { robinhoodTestnet } from "./chains.js";
import { readAccountSummary, readBlock, readTransaction } from "./reads.js";

const URLS = ["https://rpc.example.com"];
const ADDR = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
const HASH = "0x" + "ab".repeat(32);

/** A fetch stub that maps JSON-RPC method -> result, reading the request body. */
function rpcStub(byMethod: Record<string, unknown>) {
  return vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { method: string };
    if (!(body.method in byMethod)) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          error: { code: -32601, message: "method not found" },
        }),
        { status: 200 },
      );
    }
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", id: 1, result: byMethod[body.method] }),
      { status: 200 },
    );
  }) as unknown as typeof globalThis.fetch;
}

describe("readAccountSummary", () => {
  it("decodes balance, nonce, and detects an externally-owned account", async () => {
    const fetchImpl = rpcStub({
      eth_getBalance: "0xde0b6b3a7640000", // 1e18 wei = 1 ETH
      eth_getTransactionCount: "0x2a", // 42
      eth_getCode: "0x",
    });

    const summary = await readAccountSummary(URLS, robinhoodTestnet, ADDR, {
      fetch: fetchImpl,
    });

    expect(summary.balanceWei).toBe("1000000000000000000");
    expect(summary.balanceFormatted).toBe("1 ETH");
    expect(summary.nonce).toBe(42);
    expect(summary.isContract).toBe(false);
    expect(summary.chainId).toBe(robinhoodTestnet.id);
  });

  it("detects a contract when code is present", async () => {
    const fetchImpl = rpcStub({
      eth_getBalance: "0x0",
      eth_getTransactionCount: "0x0",
      eth_getCode: "0x60806040",
    });
    const summary = await readAccountSummary(URLS, robinhoodTestnet, ADDR, {
      fetch: fetchImpl,
    });
    expect(summary.isContract).toBe(true);
  });

  it("rejects an invalid address before making any request", async () => {
    const fetchImpl = rpcStub({});
    await expect(
      readAccountSummary(URLS, robinhoodTestnet, "not-an-address", { fetch: fetchImpl }),
    ).rejects.toSatisfy(isHoodStackError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("readTransaction", () => {
  it("reports a mined, successful transaction", async () => {
    const fetchImpl = rpcStub({
      eth_getTransactionByHash: {
        from: "0xfrom",
        to: "0xto",
        value: "0xde0b6b3a7640000",
      },
      eth_getTransactionReceipt: {
        status: "0x1",
        blockNumber: "0x10",
        gasUsed: "0x5208",
      },
    });

    const tx = await readTransaction(URLS, robinhoodTestnet, HASH, { fetch: fetchImpl });

    expect(tx.found).toBe(true);
    expect(tx.status).toBe("success");
    expect(tx.valueFormatted).toBe("1 ETH");
    expect(tx.blockNumber).toBe(16);
    expect(tx.gasUsed).toBe("21000");
  });

  it("reports pending when there is no receipt yet", async () => {
    const fetchImpl = rpcStub({
      eth_getTransactionByHash: { from: "0xfrom", to: "0xto", value: "0x0" },
      eth_getTransactionReceipt: null,
    });
    const tx = await readTransaction(URLS, robinhoodTestnet, HASH, { fetch: fetchImpl });
    expect(tx.status).toBe("pending");
    expect(tx.blockNumber).toBeNull();
  });

  it("reports not found for an unknown hash", async () => {
    const fetchImpl = rpcStub({
      eth_getTransactionByHash: null,
      eth_getTransactionReceipt: null,
    });
    const tx = await readTransaction(URLS, robinhoodTestnet, HASH, { fetch: fetchImpl });
    expect(tx.found).toBe(false);
    expect(tx.status).toBeNull();
  });
});

describe("readBlock", () => {
  it("decodes a block header", async () => {
    const fetchImpl = rpcStub({
      eth_getBlockByNumber: {
        number: "0x10",
        hash: "0xblockhash",
        timestamp: "0x6553f100",
        transactions: ["0xa", "0xb", "0xc"],
        gasUsed: "0x5208",
        gasLimit: "0x1c9c380",
      },
    });

    const block = await readBlock(URLS, "latest", { fetch: fetchImpl });

    expect(block.number).toBe(16);
    expect(block.transactionCount).toBe(3);
    expect(block.gasUsed).toBe("21000");
    expect(block.timestamp).toBe(new Date(0x6553f100 * 1000).toISOString());
  });
});
