import { normalizeError, type HoodStackErrorJSON } from "@hoodstack/errors";

import { redactUrl, rpcRequest, type RpcRequestOptions } from "./rpc.js";
import type { HoodStackChain } from "./types.js";

export interface RpcHealthReport {
  /** Credential-stripped endpoint URL, safe to log and display. */
  readonly endpoint: string;
  readonly healthy: boolean;
  /** Round-trip time of the probe, in milliseconds. */
  readonly latencyMs: number;
  readonly chainId?: number;
  readonly blockNumber?: bigint;
  /**
   * Whether the endpoint reports the chain ID that was expected.
   *
   * `false` means the endpoint is reachable but serving a different network -
   * a misconfiguration that is far more dangerous than an outage, because reads
   * succeed while returning data from the wrong chain.
   */
  readonly chainIdMatches?: boolean;
  readonly error?: HoodStackErrorJSON;
}

export interface CheckRpcHealthOptions extends RpcRequestOptions {
  /** Chain ID the endpoint is expected to serve. */
  readonly expectedChainId?: number;
}

/**
 * Probes an RPC endpoint.
 *
 * Never throws - an unreachable endpoint is a result, not an exception. Used by
 * `hoodstack doctor`, the dashboard's network panel, and provider failover.
 */
export async function checkRpcHealth(
  url: string,
  options: CheckRpcHealthOptions = {},
): Promise<RpcHealthReport> {
  const endpoint = redactUrl(url);
  const startedAt = Date.now();

  // No retries: this is a liveness probe. Retrying would report a degraded
  // endpoint as merely slow, which is exactly what the probe exists to catch.
  const requestOptions: RpcRequestOptions = {
    ...options,
    timeoutMs: options.timeoutMs ?? 5_000,
    retries: 0,
  };

  try {
    const [chainIdHex, blockNumberHex] = await Promise.all([
      rpcRequest<string>(url, "eth_chainId", [], requestOptions),
      rpcRequest<string>(url, "eth_blockNumber", [], requestOptions),
    ]);

    const chainId = Number(BigInt(chainIdHex));
    const blockNumber = BigInt(blockNumberHex);
    const chainIdMatches =
      options.expectedChainId === undefined
        ? undefined
        : chainId === options.expectedChainId;

    return {
      endpoint,
      healthy: chainIdMatches !== false,
      latencyMs: Date.now() - startedAt,
      chainId,
      blockNumber,
      ...(chainIdMatches === undefined ? {} : { chainIdMatches }),
    };
  } catch (error) {
    return {
      endpoint,
      healthy: false,
      latencyMs: Date.now() - startedAt,
      error: normalizeError(error, "HS_RPC_ERROR").toJSON(),
    };
  }
}

export interface ChainHealthReport {
  readonly chainId: number;
  readonly network: string;
  readonly healthy: boolean;
  readonly endpoints: readonly RpcHealthReport[];
}

/**
 * Probes every configured endpoint for a chain, in parallel.
 *
 * The chain is healthy if at least one endpoint is serving the right network.
 */
export async function checkChainHealth(
  chain: HoodStackChain,
  options: { readonly rpcUrls?: readonly string[] } & RpcRequestOptions = {},
): Promise<ChainHealthReport> {
  const { rpcUrls, ...rpcOptions } = options;
  const urls = rpcUrls ?? chain.rpcUrls.default.http;

  const endpoints = await Promise.all(
    urls.map((url) => checkRpcHealth(url, { ...rpcOptions, expectedChainId: chain.id })),
  );

  return {
    chainId: chain.id,
    network: chain.network,
    healthy: endpoints.some((report) => report.healthy),
    endpoints,
  };
}
