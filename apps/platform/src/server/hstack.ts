import "server-only";

import { readToken, robinhood, type TokenSummary } from "@hoodstack/network";

import { HSTACK } from "@/lib/hstack";
import { rpcUrlsForEnvironment } from "@/server/chain";

/**
 * Read the live HSTACK token from Robinhood Chain mainnet.
 *
 * Returns the on-chain metadata (name, symbol, decimals, total supply) or null
 * if the read fails, so a caller can fall back to the verified identity in
 * `HSTACK` and never block a page render on an RPC hiccup.
 */
export async function readHstack(): Promise<TokenSummary | null> {
  try {
    return await readToken(
      rpcUrlsForEnvironment("live"),
      robinhood,
      HSTACK.address,
      undefined,
      { timeoutMs: 10_000 },
    );
  } catch {
    return null;
  }
}
