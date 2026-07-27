import { HoodStackError, isHoodStackError } from "@hoodstack/errors";
import {
  decodeFunctionResult,
  encodeFunctionData,
  erc20Abi,
  formatGwei,
  formatUnits,
  getAddress,
  isAddress,
  isHash,
} from "viem";

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

export interface GasSummary {
  gasPriceWei: string;
  gasPriceGwei: string;
  baseFeeWei: string | null;
  /** Cost of a 21000-gas native transfer at the current gas price. */
  transferCostWei: string;
  transferCostFormatted: string;
}

/** Current gas price and base fee, with a worked example transfer cost. */
export async function readGas(
  urls: readonly string[],
  chain: HoodStackChain,
  options: RpcRequestOptions = {},
): Promise<GasSummary> {
  const [gasHex, block] = await Promise.all([
    rpcRequestWithFallback<string>(urls, "eth_gasPrice", [], options),
    rpcRequestWithFallback<Record<string, unknown> | null>(
      urls,
      "eth_getBlockByNumber",
      ["latest", false],
      options,
    ),
  ]);

  const gasPrice = fromHexQuantity(gasHex);
  const baseFee =
    block && typeof block["baseFeePerGas"] === "string"
      ? fromHexQuantity(block["baseFeePerGas"])
      : null;
  const transferCost = gasPrice * 21_000n;

  return {
    gasPriceWei: gasPrice.toString(),
    gasPriceGwei: formatGwei(gasPrice),
    baseFeeWei: baseFee !== null ? baseFee.toString() : null,
    transferCostWei: transferCost.toString(),
    transferCostFormatted: formatNative(transferCost, chain, { withSymbol: true }),
  };
}

export interface SimulationRequest {
  from?: string;
  to: string;
  /** Native value to send, in wei, as a decimal string. */
  valueWei?: string;
  /** Calldata, hex. */
  data?: string;
}

export interface SimulationResult {
  success: boolean;
  gasEstimate: string | null;
  returnData: string | null;
  revertReason: string | null;
}

/**
 * Simulate a transaction with `eth_call` and estimate its gas, without signing
 * or submitting anything. On a revert, `success` is false and `revertReason`
 * carries the node's message. This is the read-only half of execution; signed
 * submission and sponsorship land with the account-abstraction provider.
 */
export async function simulateTransaction(
  urls: readonly string[],
  req: SimulationRequest,
  options: RpcRequestOptions = {},
): Promise<SimulationResult> {
  const call: Record<string, string> = { to: assertAddress(req.to) };
  if (req.from) call["from"] = assertAddress(req.from);
  if (req.valueWei && req.valueWei !== "0") {
    call["value"] = `0x${BigInt(req.valueWei).toString(16)}`;
  }
  if (req.data && req.data !== "0x") {
    if (!/^0x[0-9a-fA-F]*$/.test(req.data)) {
      throw new HoodStackError("HS_INVALID_PARAMETER", {
        message: "`data` must be a 0x-prefixed hex string.",
      });
    }
    call["data"] = req.data;
  }

  try {
    const returnData = await rpcRequestWithFallback<string>(
      urls,
      "eth_call",
      [call, "latest"],
      options,
    );

    let gasEstimate: string | null = null;
    try {
      const gasHex = await rpcRequestWithFallback<string>(
        urls,
        "eth_estimateGas",
        [call],
        options,
      );
      gasEstimate = fromHexQuantity(gasHex).toString();
    } catch {
      // Estimation can fail where the call succeeds; leave it unset.
    }

    return { success: true, gasEstimate, returnData, revertReason: null };
  } catch (error) {
    const revertReason = isHoodStackError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Execution reverted.";
    return { success: false, gasEstimate: null, returnData: null, revertReason };
  }
}

export interface TokenSummary {
  address: `0x${string}`;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  totalSupplyFormatted: string;
  holder: `0x${string}` | null;
  holderBalance: string | null;
  holderBalanceFormatted: string | null;
}

/**
 * ERC-20 metadata for a token contract, and optionally a holder's balance.
 *
 * Reads name, symbol, decimals, and total supply with `eth_call`, decoding via
 * the standard ERC-20 ABI. If the calls do not decode, the address is not a
 * conforming ERC-20 and a clear error is thrown rather than a garbled result.
 */
export async function readToken(
  urls: readonly string[],
  chain: HoodStackChain,
  tokenAddress: string,
  holder: string | undefined = undefined,
  options: RpcRequestOptions = {},
): Promise<TokenSummary> {
  const token = assertAddress(tokenAddress);

  const call = (
    functionName: "name" | "symbol" | "decimals" | "totalSupply" | "balanceOf",
    args?: readonly [`0x${string}`],
  ) =>
    rpcRequestWithFallback<`0x${string}`>(
      urls,
      "eth_call",
      [
        { to: token, data: encodeFunctionData({ abi: erc20Abi, functionName, args }) },
        "latest",
      ],
      options,
    );

  let name: string;
  let symbol: string;
  let decimals: number;
  let totalSupply: bigint;
  try {
    const [nameHex, symbolHex, decimalsHex, supplyHex] = await Promise.all([
      call("name"),
      call("symbol"),
      call("decimals"),
      call("totalSupply"),
    ]);
    name = decodeFunctionResult({ abi: erc20Abi, functionName: "name", data: nameHex });
    symbol = decodeFunctionResult({ abi: erc20Abi, functionName: "symbol", data: symbolHex });
    decimals = decodeFunctionResult({ abi: erc20Abi, functionName: "decimals", data: decimalsHex });
    totalSupply = decodeFunctionResult({
      abi: erc20Abi,
      functionName: "totalSupply",
      data: supplyHex,
    });
  } catch {
    throw new HoodStackError("HS_INVALID_REQUEST", {
      message: "No ERC-20 metadata at this address. It may not be a token contract.",
      details: { address: token },
    });
  }

  let holderAddress: `0x${string}` | null = null;
  let holderBalance: string | null = null;
  let holderBalanceFormatted: string | null = null;
  if (holder) {
    holderAddress = assertAddress(holder);
    const balanceHex = await call("balanceOf", [holderAddress]);
    const balance = decodeFunctionResult({
      abi: erc20Abi,
      functionName: "balanceOf",
      data: balanceHex,
    });
    holderBalance = balance.toString();
    holderBalanceFormatted = formatUnits(balance, decimals);
  }

  return {
    address: token,
    chainId: chain.id,
    name,
    symbol,
    decimals,
    totalSupply: totalSupply.toString(),
    totalSupplyFormatted: formatUnits(totalSupply, decimals),
    holder: holderAddress,
    holderBalance,
    holderBalanceFormatted,
  };
}
