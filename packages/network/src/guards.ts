import { HoodStackError } from "@hoodstack/errors";

import { getChainById, getChainByNetwork, ROBINHOOD_CHAINS } from "./chains.js";
import type { HoodStackChain } from "./types.js";

/** Whether a chain ID belongs to a Robinhood Chain network. */
export function isRobinhoodChain(chainId: number): boolean {
  return getChainById(chainId) !== undefined;
}

/**
 * Asserts a chain ID is a Robinhood Chain network and returns its definition.
 *
 * Call this before constructing or signing anything. Signing a payload built for
 * one chain against a wallet connected to another is the failure mode this
 * guards: it can produce a valid signature on an unintended network.
 */
export function assertRobinhoodChain(chainId: number): HoodStackChain {
  const chain = getChainById(chainId);
  if (!chain) {
    throw new HoodStackError("HS_UNSUPPORTED_CHAIN", {
      message:
        `Chain ${chainId} is not a Robinhood Chain network. ` +
        `Supported: ${ROBINHOOD_CHAINS.map((c) => `${c.name} (${c.id})`).join(", ")}.`,
      details: {
        actualChainId: chainId,
        supportedChainIds: ROBINHOOD_CHAINS.map((c) => c.id),
      },
    });
  }
  return chain;
}

/**
 * Asserts the connected chain matches the chain an operation targets.
 *
 * Run immediately before signing and again before submission - a wallet can
 * switch networks between those two points.
 */
export function assertChainMatches(
  connectedChainId: number,
  expected: HoodStackChain | number,
): void {
  const expectedId = typeof expected === "number" ? expected : expected.id;
  if (connectedChainId === expectedId) return;

  const expectedChain = getChainById(expectedId);
  const connectedChain = getChainById(connectedChainId);

  throw new HoodStackError("HS_CHAIN_MISMATCH", {
    message:
      `Connected to chain ${connectedChainId}` +
      (connectedChain ? ` (${connectedChain.name})` : "") +
      `, but this operation targets chain ${expectedId}` +
      (expectedChain ? ` (${expectedChain.name})` : "") +
      ". Switch networks and try again.",
    details: { connectedChainId, expectedChainId: expectedId },
  });
}

/**
 * Gates state-changing operations on mainnet.
 *
 * Mainnet writes are off unless a project explicitly turns them on. Reads are
 * unaffected, and testnet is always permitted - the point is that no
 * configuration mistake or copied snippet can silently spend real funds.
 */
export function assertWriteAllowed(
  chain: HoodStackChain,
  options: { readonly allowMainnetWrites: boolean },
): void {
  if (chain.isTestnet || options.allowMainnetWrites) return;

  throw new HoodStackError("HS_MAINNET_WRITES_DISABLED", {
    message:
      `Mainnet writes are disabled for this project, so this ${chain.name} ` +
      "transaction was not submitted. Enable mainnet writes in project settings " +
      "to allow it.",
    details: { chainId: chain.id, network: chain.network },
  });
}

/**
 * Resolves a chain from a network ID, numeric chain ID, or chain object.
 *
 * Accepts the shapes that appear across SDK options, API payloads, and CLI
 * flags so callers do not each write their own coercion.
 */
export function resolveChain(
  input: HoodStackChain | RobinhoodChainInput,
): HoodStackChain {
  if (typeof input === "object") return input;
  if (typeof input === "number") return assertRobinhoodChain(input);

  const chain = getChainByNetwork(input);
  if (!chain) {
    throw new HoodStackError("HS_UNSUPPORTED_CHAIN", {
      message:
        `Unknown network "${input}". ` +
        `Supported: ${ROBINHOOD_CHAINS.map((c) => c.network).join(", ")}.`,
      details: { received: input },
    });
  }
  return chain;
}

export type RobinhoodChainInput = HoodStackChain | number | string;
