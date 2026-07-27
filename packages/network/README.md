# @hoodstack/network

Robinhood Chain network definitions and read helpers for
[HoodStack](https://www.hoodstack.io).

viem-compatible chain definitions for Robinhood Chain, plus typed read helpers,
chain-safety guards, explorer links, and a JSON-RPC client with endpoint
fallback. Testnet is the default everywhere.

## Install

```bash
npm install @hoodstack/network viem
```

`viem` is a peer dependency.

## Chains

The definitions extend viem's `Chain`, so they drop straight into
`createPublicClient`, wagmi, or any viem-compatible tooling.

```ts
import { robinhood, robinhoodTestnet } from "@hoodstack/network";
import { createPublicClient, http } from "viem";

// Robinhood Chain mainnet is 4663; testnet is 46630.
const client = createPublicClient({ chain: robinhoodTestnet, transport: http() });
```

## Reads

Decoded, typed reads over JSON-RPC. Each fails over across endpoints and returns
plain shapes, no hex or wei arithmetic.

```ts
import {
  readAccountSummary,
  readTransaction,
  readToken,
  readGas,
  simulateTransaction,
  robinhoodTestnet,
} from "@hoodstack/network";

const urls = robinhoodTestnet.rpcUrls.default.http;

const account = await readAccountSummary(urls, robinhoodTestnet, "0x…");
account.balanceFormatted; // "1.5 ETH"
account.isContract;       // false

const gas = await readGas(urls, robinhoodTestnet);
const sim = await simulateTransaction(urls, { to: "0x…", valueWei: "1" });
```

## Safety guards

```ts
import { assertChainMatches, assertWriteAllowed } from "@hoodstack/network";

// A wallet can switch networks between building and signing; validate before each.
assertChainMatches(await wallet.getChainId(), robinhoodTestnet);

// Mainnet writes are disabled by default; enabling them is explicit.
assertWriteAllowed(robinhood, { allowMainnetWrites: false });
```

## Also included

- Explorer links: `getExplorerTxUrl`, `getExplorerAddressUrl`,
  `getExplorerBlockUrl`, `getExplorerTokenUrl`, `getFaucetUrl`
- Currency: `formatNative`, `parseNative`
- JSON-RPC: `rpcRequest`, `rpcRequestWithFallback`, `IDEMPOTENT_METHODS`
- Diagnostics: `checkRpcHealth`, `checkChainHealth`
- Config: `resolveRpcUrls`, `isPublicRobinhoodEndpoint`

## License

Apache-2.0
