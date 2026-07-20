import { isHoodStackError } from "@hoodstack/errors";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_CHAIN,
  ROBINHOOD_CHAINS,
  getChainById,
  robinhood,
  robinhoodTestnet,
} from "./chains.js";
import { isPublicRobinhoodEndpoint, resolveRpcUrls } from "./config.js";
import { formatNative, parseNative } from "./currency.js";
import {
  getExplorerAddressUrl,
  getExplorerTxUrl,
  getExplorerUserOpUrl,
  getFaucetUrl,
} from "./explorer.js";
import {
  assertChainMatches,
  assertRobinhoodChain,
  assertWriteAllowed,
  isRobinhoodChain,
  resolveChain,
} from "./guards.js";

describe("chain definitions", () => {
  it("pins the documented chain IDs", () => {
    // These are consensus-critical. A wrong value here signs for another network.
    expect(robinhood.id).toBe(4663);
    expect(robinhoodTestnet.id).toBe(46630);
  });

  it("uses ETH as the native currency on both networks", () => {
    for (const chain of ROBINHOOD_CHAINS) {
      expect(chain.nativeCurrency.symbol).toBe("ETH");
      expect(chain.nativeCurrency.decimals).toBe(18);
    }
  });

  it("defaults to testnet", () => {
    expect(DEFAULT_CHAIN.id).toBe(robinhoodTestnet.id);
    expect(DEFAULT_CHAIN.isTestnet).toBe(true);
  });

  it("exposes a faucet on testnet only", () => {
    expect(getFaucetUrl(robinhoodTestnet)).toBe(
      "https://faucet.testnet.chain.robinhood.com",
    );
    expect(getFaucetUrl(robinhood)).toBeUndefined();
  });

  it("keeps testnet flags consistent with the viem-compatible field", () => {
    for (const chain of ROBINHOOD_CHAINS) {
      expect(chain.isTestnet).toBe(chain.testnet);
    }
  });

  it("has no duplicate chain IDs or network identifiers", () => {
    expect(new Set(ROBINHOOD_CHAINS.map((c) => c.id)).size).toBe(ROBINHOOD_CHAINS.length);
    expect(new Set(ROBINHOOD_CHAINS.map((c) => c.network)).size).toBe(
      ROBINHOOD_CHAINS.length,
    );
  });
});

describe("chain guards", () => {
  it("recognizes Robinhood Chain networks", () => {
    expect(isRobinhoodChain(4663)).toBe(true);
    expect(isRobinhoodChain(46630)).toBe(true);
    expect(isRobinhoodChain(1)).toBe(false);
  });

  it("rejects non-Robinhood chains with an actionable error", () => {
    try {
      assertRobinhoodChain(1);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(isHoodStackError(error) && error.code).toBe("HS_UNSUPPORTED_CHAIN");
      expect((error as Error).message).toContain("4663");
    }
  });

  it("detects a chain mismatch between wallet and operation", () => {
    expect(() => assertChainMatches(46630, robinhoodTestnet)).not.toThrow();
    try {
      assertChainMatches(1, robinhoodTestnet);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(isHoodStackError(error) && error.code).toBe("HS_CHAIN_MISMATCH");
      expect(isHoodStackError(error) && error.details).toMatchObject({
        connectedChainId: 1,
        expectedChainId: 46630,
      });
    }
  });

  it("resolves chains from every accepted input shape", () => {
    expect(resolveChain(4663).id).toBe(4663);
    expect(resolveChain("robinhood-testnet").id).toBe(46630);
    expect(resolveChain(robinhood)).toBe(robinhood);
    expect(() => resolveChain("ethereum")).toThrow();
  });

  it("returns undefined for unknown lookups rather than throwing", () => {
    expect(getChainById(999)).toBeUndefined();
  });
});

describe("assertWriteAllowed", () => {
  it("always permits testnet writes", () => {
    expect(() =>
      assertWriteAllowed(robinhoodTestnet, { allowMainnetWrites: false }),
    ).not.toThrow();
  });

  it("blocks mainnet writes unless explicitly enabled", () => {
    // The default must be closed: a misconfiguration should never spend real funds.
    try {
      assertWriteAllowed(robinhood, { allowMainnetWrites: false });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(isHoodStackError(error) && error.code).toBe("HS_MAINNET_WRITES_DISABLED");
    }

    expect(() =>
      assertWriteAllowed(robinhood, { allowMainnetWrites: true }),
    ).not.toThrow();
  });
});

describe("explorer links", () => {
  it("builds transaction and address links", () => {
    expect(getExplorerTxUrl(robinhood, "0xabc")).toBe(
      "https://robinhoodchain.blockscout.com/tx/0xabc",
    );
    expect(getExplorerAddressUrl(robinhoodTestnet, "0xdef")).toBe(
      "https://explorer.testnet.chain.robinhood.com/address/0xdef",
    );
  });

  it("routes user operations to the dedicated path", () => {
    // A user-op hash does not resolve under /tx/.
    expect(getExplorerUserOpUrl(robinhoodTestnet, "0x123")).toBe(
      "https://explorer.testnet.chain.robinhood.com/op/0x123",
    );
  });
});

describe("native currency formatting", () => {
  it("formats and trims trailing zeros", () => {
    expect(formatNative(1_000_000_000_000_000_000n, robinhood)).toBe("1");
    expect(formatNative(1_500_000_000_000_000_000n, robinhood)).toBe("1.5");
    expect(formatNative(0n, robinhood)).toBe("0");
  });

  it("appends the symbol on request", () => {
    expect(
      formatNative(1_000_000_000_000_000_000n, robinhood, { withSymbol: true }),
    ).toBe("1 ETH");
  });

  it("never renders non-zero dust as zero", () => {
    expect(formatNative(1n, robinhood)).toBe("<0.000001");
    expect(formatNative(-1n, robinhood)).toBe(">-0.000001");
  });

  it("truncates rather than rounds up", () => {
    // 1.9999995 must not display as 2 - that would overstate the balance.
    expect(formatNative(1_999_999_500_000_000_000n, robinhood)).toBe("1.999999");
  });

  it("round-trips whole and fractional amounts", () => {
    expect(parseNative("1.5", robinhood)).toBe(1_500_000_000_000_000_000n);
    expect(parseNative("0", robinhood)).toBe(0n);
  });

  it("rejects malformed amounts", () => {
    for (const bad of ["", "abc", "1.2.3", "1,5", "-"]) {
      expect(() => parseNative(bad, robinhood), bad).toThrow();
    }
  });

  it("rejects excess precision instead of truncating it", () => {
    // Silently dropping a digit from an amount field is a fund-loss bug.
    expect(() => parseNative(`0.${"1".repeat(19)}`, robinhood)).toThrow();
  });
});

describe("RPC endpoint resolution", () => {
  it("prefers configured endpoints", () => {
    expect(resolveRpcUrls(robinhood, { rpcUrls: ["https://rpc.example.com"] })).toEqual([
      "https://rpc.example.com",
    ]);
  });

  it("falls back to the public endpoint in development", () => {
    expect(resolveRpcUrls(robinhoodTestnet)).toEqual([
      "https://rpc.testnet.chain.robinhood.com",
    ]);
  });

  it("refuses to default to a public endpoint in production", () => {
    // Shipping without configured RPC should fail at startup, not under load.
    expect(() => resolveRpcUrls(robinhood, { environment: "production" })).toThrow();
    expect(
      resolveRpcUrls(robinhood, {
        environment: "production",
        allowPublicEndpoints: true,
      }),
    ).toEqual(["https://rpc.mainnet.chain.robinhood.com"]);
  });

  it("ignores blank configured entries", () => {
    expect(resolveRpcUrls(robinhoodTestnet, { rpcUrls: ["", "  "] })).toEqual([
      "https://rpc.testnet.chain.robinhood.com",
    ]);
  });

  it("identifies the shared public endpoints", () => {
    expect(isPublicRobinhoodEndpoint("https://rpc.mainnet.chain.robinhood.com")).toBe(
      true,
    );
    expect(isPublicRobinhoodEndpoint("https://rpc.example.com")).toBe(false);
  });
});
