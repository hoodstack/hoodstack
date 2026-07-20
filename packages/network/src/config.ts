import { HoodStackError } from "@hoodstack/errors";

import { ROBINHOOD_CHAINS } from "./chains.js";
import type { HoodStackChain } from "./types.js";

const PUBLIC_ENDPOINTS: ReadonlySet<string> = new Set(
  ROBINHOOD_CHAINS.flatMap((chain) => {
    const publicUrls = chain.rpcUrls.public ?? chain.rpcUrls.default;
    return [...publicUrls.http, ...(publicUrls.webSocket ?? [])];
  }),
);

/**
 * Whether a URL is one of the shared public Robinhood Chain endpoints.
 *
 * These are rate-limited and shared across every developer on the network. They
 * are appropriate for local development and diagnostics, not production traffic.
 */
export function isPublicRobinhoodEndpoint(url: string): boolean {
  return PUBLIC_ENDPOINTS.has(url.replace(/\/+$/, ""));
}

export interface ResolveRpcOptions {
  /** Endpoints from configuration, highest priority first. */
  readonly rpcUrls?: readonly string[];
  /**
   * Deployment environment. In `production`, falling back to the shared public
   * endpoint is an error rather than a silent default.
   */
  readonly environment?: "development" | "production";
  /** Escape hatch for deliberately using public endpoints in production. */
  readonly allowPublicEndpoints?: boolean;
}

/**
 * Resolves the RPC endpoints to use for a chain.
 *
 * Configured endpoints always win. The public endpoint is a development
 * convenience: in production it must be opted into explicitly, so that shipping
 * without configuring RPC fails loudly at startup instead of degrading under
 * load in front of users.
 */
export function resolveRpcUrls(
  chain: HoodStackChain,
  options: ResolveRpcOptions = {},
): readonly string[] {
  const { environment = "development", allowPublicEndpoints = false } = options;
  const configured = (options.rpcUrls ?? []).filter((url) => url.trim().length > 0);

  if (configured.length > 0) return configured;

  if (environment === "production" && !allowPublicEndpoints) {
    throw new HoodStackError("HS_INVALID_REQUEST", {
      message:
        `No RPC endpoint is configured for ${chain.name}. The public endpoint is ` +
        "rate-limited and shared, so it is not used as a production default. Set a " +
        "dedicated RPC URL, or pass allowPublicEndpoints to override.",
      details: { chainId: chain.id, network: chain.network },
    });
  }

  return chain.rpcUrls.default.http;
}
