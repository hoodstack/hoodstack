import type { HoodStackChain, RobinhoodNetworkId } from "./types.js";

/**
 * Native currency for both Robinhood Chain networks.
 *
 * Robinhood Chain is an Ethereum-compatible L2 built with Arbitrum technology
 * and pays gas in ETH. The HoodStack token is not a gas asset on this chain.
 */
const ETH = { name: "Ether", symbol: "ETH", decimals: 18 } as const;

/**
 * Finality defaults.
 *
 * These are HoodStack polling *policy*, not properties of the chain. They size
 * receipt polling and set when a transaction is reported confirmed. Callers can
 * override them per project or per transaction; mainnet is deliberately more
 * conservative than testnet.
 */
const MAINNET_FINALITY = {
  defaultConfirmations: 2,
  blockTimeMs: 1_000,
  receiptTimeoutMs: 120_000,
} as const;

const TESTNET_FINALITY = {
  defaultConfirmations: 1,
  blockTimeMs: 1_000,
  receiptTimeoutMs: 90_000,
} as const;

/**
 * Robinhood Chain mainnet.
 *
 * The RPC URL here is the public, rate-limited endpoint. It is suitable for
 * local development and diagnostics only - production deployments must supply a
 * dedicated endpoint. See `resolveRpcUrls`.
 */
export const robinhood: HoodStackChain = {
  id: 4663,
  name: "Robinhood Chain",
  network: "robinhood",
  isTestnet: false,
  nativeCurrency: ETH,
  rpcUrls: {
    default: {
      http: ["https://rpc.mainnet.chain.robinhood.com"],
      webSocket: ["wss://feed.mainnet.chain.robinhood.com"],
    },
    public: {
      http: ["https://rpc.mainnet.chain.robinhood.com"],
      webSocket: ["wss://feed.mainnet.chain.robinhood.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
  sequencer: {
    http: "https://sequencer.mainnet.chain.robinhood.com",
    feed: "wss://feed.mainnet.chain.robinhood.com",
  },
  finality: MAINNET_FINALITY,
  testnet: false,
};

/** Robinhood Chain testnet. The default network for HoodStack development. */
export const robinhoodTestnet: HoodStackChain = {
  id: 46630,
  name: "Robinhood Chain Testnet",
  network: "robinhood-testnet",
  isTestnet: true,
  nativeCurrency: ETH,
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.chain.robinhood.com"],
      webSocket: ["wss://feed.testnet.chain.robinhood.com"],
    },
    public: {
      http: ["https://rpc.testnet.chain.robinhood.com"],
      webSocket: ["wss://feed.testnet.chain.robinhood.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
  sequencer: {
    http: "https://sequencer.testnet.chain.robinhood.com",
    feed: "wss://feed.testnet.chain.robinhood.com",
  },
  faucetUrl: "https://faucet.testnet.chain.robinhood.com",
  finality: TESTNET_FINALITY,
  testnet: true,
};

/**
 * The network used when none is specified.
 *
 * Testnet by design. Selecting mainnet is always an explicit act.
 */
export const DEFAULT_CHAIN: HoodStackChain = robinhoodTestnet;

export const ROBINHOOD_CHAINS: readonly HoodStackChain[] = [robinhood, robinhoodTestnet];

const BY_ID = new Map<number, HoodStackChain>(
  ROBINHOOD_CHAINS.map((chain) => [chain.id, chain]),
);

const BY_NETWORK = new Map<RobinhoodNetworkId, HoodStackChain>(
  ROBINHOOD_CHAINS.map((chain) => [chain.network, chain]),
);

/** Returns the chain for a numeric chain ID, or `undefined` if not Robinhood Chain. */
export function getChainById(chainId: number): HoodStackChain | undefined {
  return BY_ID.get(chainId);
}

/** Returns the chain for a network identifier, or `undefined` if unrecognized. */
export function getChainByNetwork(network: string): HoodStackChain | undefined {
  return BY_NETWORK.get(network as RobinhoodNetworkId);
}
