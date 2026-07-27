import { robinhood, robinhoodTestnet, type HoodStackChain } from "@hoodstack/network";

import type { KeyEnvironment } from "@/lib/api-keys";

/**
 * The active network, shared across the whole dashboard.
 *
 * Network selection is a single axis: `test` acts against Robinhood Chain
 * Testnet, `live` against mainnet - the same axis a key's environment names. One
 * cookie holds the choice so the server shell and every client module agree on
 * first paint, and a switch re-aligns all of them at once.
 */

/** Cookie that persists the selected network. Readable on the server and client. */
export const NETWORK_COOKIE = "hs-network";

/** Testnet-first: an unset or unrecognized cookie means testnet. */
export const DEFAULT_NETWORK: KeyEnvironment = "test";

export function isNetwork(value: unknown): value is KeyEnvironment {
  return value === "test" || value === "live";
}

export function parseNetwork(value: unknown): KeyEnvironment {
  return isNetwork(value) ? value : DEFAULT_NETWORK;
}

export function chainForNetwork(network: KeyEnvironment): HoodStackChain {
  return network === "live" ? robinhood : robinhoodTestnet;
}

export function networkLabel(network: KeyEnvironment): string {
  return network === "live" ? "Mainnet" : "Testnet";
}
