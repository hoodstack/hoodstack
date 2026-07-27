import { isHoodStackError } from "@hoodstack/errors";
import { describe, expect, it, vi } from "vitest";
import { encodeFunctionResult, erc20Abi } from "viem";

import { robinhoodTestnet } from "./chains.js";
import {
  readAccountSummary,
  readBlock,
  readGas,
  readToken,
  readTransaction,
  simulateTransaction,
} from "./reads.js";

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

describe("readGas", () => {
  it("decodes gas price, base fee, and a transfer cost", async () => {
    const fetchImpl = rpcStub({
      eth_gasPrice: "0x3b9aca00", // 1 gwei
      eth_getBlockByNumber: { baseFeePerGas: "0x3b9aca00" },
    });
    const gas = await readGas(URLS, robinhoodTestnet, { fetch: fetchImpl });
    expect(gas.gasPriceWei).toBe("1000000000");
    expect(gas.gasPriceGwei).toBe("1");
    expect(gas.baseFeeWei).toBe("1000000000");
    // 1 gwei * 21000 = 21000 gwei = 0.000021 ETH
    expect(gas.transferCostWei).toBe("21000000000000");
    expect(gas.transferCostFormatted).toBe("0.000021 ETH");
  });

  it("tolerates a chain without a base fee", async () => {
    const fetchImpl = rpcStub({
      eth_gasPrice: "0x3b9aca00",
      eth_getBlockByNumber: {},
    });
    const gas = await readGas(URLS, robinhoodTestnet, { fetch: fetchImpl });
    expect(gas.baseFeeWei).toBeNull();
  });
});

describe("simulateTransaction", () => {
  it("reports success and a gas estimate for a passing call", async () => {
    const fetchImpl = rpcStub({
      eth_call: "0x",
      eth_estimateGas: "0x5208", // 21000
    });
    const result = await simulateTransaction(URLS, { to: ADDR, valueWei: "1" }, {
      fetch: fetchImpl,
    });
    expect(result.success).toBe(true);
    expect(result.gasEstimate).toBe("21000");
    expect(result.revertReason).toBeNull();
  });

  it("reports the revert reason when the call reverts", async () => {
    const fetchImpl = rpcStub({}); // no methods -> RPC error for eth_call
    const result = await simulateTransaction(URLS, { to: ADDR }, { fetch: fetchImpl });
    expect(result.success).toBe(false);
    expect(result.revertReason).toBeTruthy();
    expect(result.gasEstimate).toBeNull();
  });

  it("rejects an invalid target address", async () => {
    const fetchImpl = rpcStub({});
    await expect(
      simulateTransaction(URLS, { to: "nope" }, { fetch: fetchImpl }),
    ).rejects.toSatisfy(isHoodStackError);
  });
});

describe("readToken", () => {
  /** A fetch stub that answers ERC-20 eth_calls by decoding the selector. */
  function tokenStub(values: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
    balance?: bigint;
  }) {
    const bySelector: Record<string, string> = {
      "0x06fdde03": encodeFunctionResult({ abi: erc20Abi, functionName: "name", result: values.name }),
      "0x95d89b41": encodeFunctionResult({ abi: erc20Abi, functionName: "symbol", result: values.symbol }),
      "0x313ce567": encodeFunctionResult({ abi: erc20Abi, functionName: "decimals", result: values.decimals }),
      "0x18160ddd": encodeFunctionResult({ abi: erc20Abi, functionName: "totalSupply", result: values.totalSupply }),
      "0x70a08231": encodeFunctionResult({ abi: erc20Abi, functionName: "balanceOf", result: values.balance ?? 0n }),
    };
    return vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { params: [{ data: string }] };
      const selector = body.params[0].data.slice(0, 10);
      const result = bySelector[selector];
      if (!result) {
        return new Response(
          JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code: 3, message: "reverted" } }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;
  }

  it("decodes ERC-20 metadata and formats total supply", async () => {
    const fetchImpl = tokenStub({
      name: "Test Token",
      symbol: "TEST",
      decimals: 18,
      totalSupply: 1_000_000_000000000000000000n,
    });
    const token = await readToken(URLS, robinhoodTestnet, ADDR, undefined, {
      fetch: fetchImpl,
    });
    expect(token.name).toBe("Test Token");
    expect(token.symbol).toBe("TEST");
    expect(token.decimals).toBe(18);
    expect(token.totalSupplyFormatted).toBe("1000000");
    expect(token.holderBalance).toBeNull();
  });

  it("reads a holder balance when a holder is given", async () => {
    const fetchImpl = tokenStub({
      name: "Test Token",
      symbol: "TEST",
      decimals: 6,
      totalSupply: 0n,
      balance: 2_500000n,
    });
    const token = await readToken(URLS, robinhoodTestnet, ADDR, ADDR, { fetch: fetchImpl });
    expect(token.holderBalanceFormatted).toBe("2.5");
  });

  it("errors clearly when the address is not an ERC-20", async () => {
    const fetchImpl = rpcStub({}); // every eth_call reverts
    await expect(
      readToken(URLS, robinhoodTestnet, ADDR, undefined, { fetch: fetchImpl }),
    ).rejects.toSatisfy(isHoodStackError);
  });
});
