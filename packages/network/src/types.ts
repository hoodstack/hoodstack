import type { Chain } from "viem";

/**
 * Stable identifier for a Robinhood Chain network.
 *
 * Used in API payloads, SDK options, and CLI flags. Prefer this over raw chain
 * IDs in developer-facing surfaces - it is self-describing and cannot be
 * confused with another chain's numeric ID.
 */
export type RobinhoodNetworkId = "robinhood" | "robinhood-testnet";

export interface FinalityConfig {
  /** Confirmations before a receipt is treated as final by default. */
  readonly defaultConfirmations: number;
  /** Approximate block time, used to size receipt polling intervals. */
  readonly blockTimeMs: number;
  /** Default ceiling for receipt polling before `receipt_timeout` is raised. */
  readonly receiptTimeoutMs: number;
}

export interface SequencerConfig {
  /** Sequencer HTTP endpoint. */
  readonly http: string;
  /** Sequencer WebSocket feed. */
  readonly feed: string;
}

/**
 * A Robinhood Chain network definition.
 *
 * Extends viem's `Chain` so it can be handed directly to `createPublicClient`,
 * wagmi, and any viem-compatible tooling, while carrying the extra metadata
 * HoodStack needs (sequencer endpoints, faucet, finality policy).
 */
export interface HoodStackChain extends Chain {
  readonly network: RobinhoodNetworkId;
  readonly isTestnet: boolean;
  readonly sequencer: SequencerConfig;
  /** Public faucet, testnet only. */
  readonly faucetUrl?: string;
  readonly finality: FinalityConfig;
}

/**
 * How a canonical asset record was verified.
 *
 * Recorded per entry so consumers can decide how much to trust it. An entry
 * without verification is not canonical.
 */
export type AssetVerificationMethod =
  | "official-documentation"
  | "onchain-contract-read"
  | "explorer-verified-source"
  | "issuer-attestation";

export type AssetCategory =
  "native" | "stablecoin" | "stock-token" | "wrapped" | "governance" | "other";

/**
 * A canonical asset record.
 *
 * Assets are identified by `chainId` + `address`. A ticker alone is never a
 * sufficient identifier - symbols are not unique and are trivially spoofed.
 */
export interface CanonicalAsset {
  readonly chainId: number;
  /** Checksummed contract address. */
  readonly address: `0x${string}`;
  readonly symbol: string;
  readonly name: string;
  readonly decimals: number;
  readonly category: AssetCategory;
  /** Who published the information this record is based on. */
  readonly source: string;
  /** URL of the source document or explorer page. */
  readonly sourceUrl: string;
  /** ISO 8601 timestamp of the last verification. */
  readonly lastVerifiedAt: string;
  readonly verificationMethod: AssetVerificationMethod;
  /** Transfer or holding restrictions, where the issuer declares any. */
  readonly restrictions?: readonly string[];
  /** For stock tokens: the referenced underlying instrument. */
  readonly underlying?: {
    readonly kind: "equity" | "etf" | "fiat" | "commodity";
    readonly identifier: string;
  };
}
