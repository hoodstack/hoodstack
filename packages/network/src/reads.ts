import { HoodStackError } from "@hoodstack/errors";
import { getAddress, isAddress, isHash } from "viem";

import { formatNative } from "./currency.js";
import { rpcRequestWithFallback } from "./rpc.js";
import type { HoodStackChain } from "./types.js";
import type { RpcRequestOptions } from "./rpc.js";

/**
 * Read helpers over Robinhood Chain JSON-RPC.
 *
 * These are the raw-RPC reads behind the Data module: account state, a single
 * transaction with its receipt, and a block header. They decode JSON-RPC hex
 * into plain, typed shapes so callers (the gateway and the dashboard) never deal
 * with hex or wei arithmetic. All methods are idempotent reads and go through
 * `rpcRequestWithFallback`, so a failing endpoint fails over to the next.
 */

/** A hex quantity (`0x…`) decoded to a bigint. */
function fromHexQuantity(value: unknown): bigint {
  if (typeof value !== "string" || !value.startsWith("0x")) {
    throw new HoodStackError("HS_RPC_ERROR", {
      message: "Expected a hex quantity from the RPC endpoint.",
      details: { received: typeof value },
    });
  }
  return BigInt(value);
}

function assertAddress(address: string): `0x${string}` {
  if (!isAddress(address)) {
    throw new HoodStackError("HS_INVALID_PARAMETER", {
      message: `"${address}" is not a valid address.`,
      details: { address },
    });
  }
  return getAddress(address);
}

function assertTxHash(hash: string): `0x${string}` {
  if (!isHash(hash)) {
    throw new HoodStackError("HS_INVALID_PARAMETER", {
      message: `"${hash}" is not a valid 32-byte transaction hash.`,
      details: { hash },
    });
  }
  return hash as `0x${string}`;
}

export interface AccountSummary {
  address: `0x${string}`;
  chainId: number;
  balanceWei: string;
  balanceFormatted: string;
  nonce: number;
  isContract: boolean;
}

/** Balance, nonce, and contract-or-not for an address, at the latest block. */
export async function readAccountSummary(
  urls: readonly string[],
  chain: HoodStackChain,
  address: string,
  options: RpcRequestOptions = {},
): Promise<AccountSummary> {
  const account = assertAddress(address);

  const [balanceHex, nonceHex, code] = await Promise.all([
    rpcRequestWithFallback<string>(urls, "eth_getBalance", [account, "latest"], options),
    rpcRequestWithFallback<string>(
      urls,
      "eth_getTransactionCount",
      [account, "latest"],
      options,
    ),
    rpcRequestWithFallback<string>(urls, "eth_getCode", [account, "latest"], options),
  ]);

  const balanceWei = fromHexQuantity(balanceHex);

  return {
    address: account,
    chainId: chain.id,
    balanceWei: balanceWei.toString(),
    balanceFormatted: formatNative(balanceWei, chain, { withSymbol: true }),
    nonce: Number(fromHexQuantity(nonceHex)),
    // "0x" means no bytecode: an externally-owned account, not a contract.
    isContract: typeof code === "string" && code.length > 2 && code !== "0x0",
  };
}

export interface TransactionSummary {
  hash: `0x${string}`;
  found: boolean;
  status: "success" | "reverted" | "pending" | null;
  from: string | null;
  to: string | null;
  valueWei: string | null;
  valueFormatted: string | null;
  blockNumber: number | null;
  gasUsed: string | null;
}

/** A transaction and its receipt, decoded. `found: false` if the hash is unknown. */
export async function readTransaction(
  urls: readonly string[],
  chain: HoodStackChain,
  hash: string,
  options: RpcRequestOptions = {},
): Promise<TransactionSummary> {
  const txHash = assertTxHash(hash);

  const [tx, receipt] = await Promise.all([
    rpcRequestWithFallback<Record<string, unknown> | null>(
      urls,
      "eth_getTransactionByHash",
      [txHash],
      options,
    ),
    rpcRequestWithFallback<Record<string, unknown> | null>(
      urls,
      "eth_getTransactionReceipt",
      [txHash],
      options,
    ),
  ]);

  if (!tx) {
    return {
      hash: txHash,
      found: false,
      status: null,
      from: null,
      to: null,
      valueWei: null,
      valueFormatted: null,
      blockNumber: null,
      gasUsed: null,
    };
  }

  const valueWei = fromHexQuantity(tx["value"]);
  const mined = receipt !== null;
  const reverted = mined && fromHexQuantity(receipt["status"]) === 0n;

  return {
    hash: txHash,
    found: true,
    status: !mined ? "pending" : reverted ? "reverted" : "success",
    from: typeof tx["from"] === "string" ? tx["from"] : null,
    to: typeof tx["to"] === "string" ? tx["to"] : null,
    valueWei: valueWei.toString(),
    valueFormatted: formatNative(valueWei, chain, { withSymbol: true }),
    blockNumber:
      mined && typeof receipt["blockNumber"] === "string"
        ? Number(fromHexQuantity(receipt["blockNumber"]))
        : null,
    gasUsed:
      mined && typeof receipt["gasUsed"] === "string"
        ? fromHexQuantity(receipt["gasUsed"]).toString()
        : null,
  };
}

export interface BlockSummary {
  number: number;
  hash: string;
  timestamp: string;
  transactionCount: number;
  gasUsed: string;
  gasLimit: string;
}

/** A block header. `blockTag` is "latest" or a positive block number. */
export async function readBlock(
  urls: readonly string[],
  blockTag: "latest" | number,
  options: RpcRequestOptions = {},
): Promise<BlockSummary> {
  const tag =
    blockTag === "latest" ? "latest" : `0x${Math.max(0, blockTag).toString(16)}`;

  const block = await rpcRequestWithFallback<Record<string, unknown> | null>(
    urls,
    "eth_getBlockByNumber",
    [tag, false],
    options,
  );

  if (!block) {
    throw new HoodStackError("HS_RESOURCE_NOT_FOUND", {
      message: `Block ${String(blockTag)} was not found.`,
      details: { blockTag },
    });
  }

  const transactions = Array.isArray(block["transactions"]) ? block["transactions"] : [];

  return {
    number: Number(fromHexQuantity(block["number"])),
    hash: typeof block["hash"] === "string" ? block["hash"] : "",
    timestamp: new Date(Number(fromHexQuantity(block["timestamp"])) * 1000).toISOString(),
    transactionCount: transactions.length,
    gasUsed: fromHexQuantity(block["gasUsed"]).toString(),
    gasLimit: fromHexQuantity(block["gasLimit"]).toString(),
  };
}
