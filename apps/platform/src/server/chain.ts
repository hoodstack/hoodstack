import "server-only";

import {
  resolveRpcUrls,
  robinhood,
  robinhoodTestnet,
  type HoodStackChain,
} from "@hoodstack/network";

import type { KeyEnvironment } from "@/lib/api-keys";
import { serverEnv } from "@/lib/env";

/**
 * Chain and RPC selection by key environment.
 *
 * A key's environment is the single source of truth for which network a request
 * acts against: live → mainnet, test → testnet. RPC URLs default to the public
 * Robinhood endpoints and are overridden by a dedicated provider endpoint when
 * one is configured in the environment.
 */

export function chainForEnvironment(environment: KeyEnvironment): HoodStackChain {
  return environment === "live" ? robinhood : robinhoodTestnet;
}

export function rpcUrlsForEnvironment(environment: KeyEnvironment): readonly string[] {
  const chain = chainForEnvironment(environment);
  const env = serverEnv();
  const override =
    environment === "live"
      ? env.HOODSTACK_RPC_URL_MAINNET
      : env.HOODSTACK_RPC_URL_TESTNET;

  return resolveRpcUrls(chain, {
    environment: "production",
    allowPublicEndpoints: true,
    rpcUrls: override ? [override] : [],
  });
}
