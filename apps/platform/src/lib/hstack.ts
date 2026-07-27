/**
 * The HoodStack token (HSTACK), live on Robinhood Chain mainnet.
 *
 * These are the on-chain facts, verified against the contract. Everything shown
 * on the site is read live from the chain; this constant is the address to read
 * from and the fallback identity if a read fails. No price, market-cap, supply
 * allocation, or listing is asserted anywhere - only what the contract reports.
 */
export const HSTACK = {
  address: "0x690145b6952fbe1eb90b5b98dffd6cd7622ce538",
  chainId: 4663,
  name: "HoodStack",
  symbol: "HSTACK",
  decimals: 18,
} as const;
