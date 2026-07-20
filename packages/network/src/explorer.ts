import { HoodStackError } from "@hoodstack/errors";

import type { HoodStackChain } from "./types.js";

/**
 * Explorer link helpers.
 *
 * Both networks use Blockscout, whose route shapes are stable. Centralizing them
 * means a future explorer change is one edit rather than a search across the
 * dashboard, SDK, CLI, and emails.
 */

function explorerBase(chain: HoodStackChain): string {
  const url = chain.blockExplorers?.default.url;
  if (!url) {
    throw new HoodStackError("HS_PROVIDER_UNSUPPORTED", {
      message: `No block explorer is configured for ${chain.name}.`,
      details: { chainId: chain.id },
    });
  }
  return url.replace(/\/+$/, "");
}

export function getExplorerTxUrl(chain: HoodStackChain, txHash: string): string {
  return `${explorerBase(chain)}/tx/${txHash}`;
}

export function getExplorerAddressUrl(chain: HoodStackChain, address: string): string {
  return `${explorerBase(chain)}/address/${address}`;
}

export function getExplorerBlockUrl(
  chain: HoodStackChain,
  block: bigint | number | string,
): string {
  return `${explorerBase(chain)}/block/${block.toString()}`;
}

export function getExplorerTokenUrl(chain: HoodStackChain, address: string): string {
  return `${explorerBase(chain)}/token/${address}`;
}

/**
 * Explorer link for an ERC-4337 user operation.
 *
 * Blockscout indexes user operations separately from the bundled transaction
 * that carries them, so a user-op hash will not resolve under `/tx/`.
 */
export function getExplorerUserOpUrl(chain: HoodStackChain, userOpHash: string): string {
  return `${explorerBase(chain)}/op/${userOpHash}`;
}

/**
 * Faucet URL for a testnet.
 *
 * Returns `undefined` on mainnet rather than throwing, so UI can simply omit the
 * link when it does not apply.
 */
export function getFaucetUrl(chain: HoodStackChain): string | undefined {
  return chain.faucetUrl;
}
