# @hoodstack/sdk

The TypeScript client for [HoodStack](https://www.hoodstack.io), developer
infrastructure for Robinhood Chain.

A small, typed client over the HoodStack API. It handles authentication, the
response envelope, and typed errors, so you work with plain results and catch a
`HoodStackError` with a stable code. Its only requirement is `fetch`, native in
Node 18+ and every browser.

## Install

```bash
npm install @hoodstack/sdk
```

## Quickstart

Create a project and an API key in the [dashboard](https://www.hoodstack.io/app),
then:

```ts
import { createClient } from "@hoodstack/sdk";

const hoodstack = createClient({ apiKey: process.env.HOODSTACK_API_KEY! });

// Account state: balance, nonce, and contract detection.
const account = await hoodstack.data.account("0x…");
console.log(account.balanceFormatted, account.isContract);

// Current gas.
const gas = await hoodstack.gas();

// Simulate a call and estimate gas. Nothing is signed or submitted.
const sim = await hoodstack.tx.simulate({
  to: "0x…",
  valueWei: "1000000000000000",
});
if (!sim.success) throw new Error(sim.revertReason ?? "Would revert");
```

A test key (`hs_test_…`) acts against Robinhood Chain testnet; a live key
(`hs_live_…`) against mainnet. Every call is authenticated, rate limited, and
metered.

## API

```ts
const client = createClient({
  apiKey: string,
  baseUrl?: string,   // defaults to https://www.hoodstack.io
  fetch?: typeof fetch,
  timeoutMs?: number, // defaults to 15000
});

client.health();                          // key check + chain
client.gas();                             // gas price, base fee, transfer cost
client.rpc(method, params?);              // read-only JSON-RPC
client.data.account(address);             // balance, nonce, isContract
client.data.transaction(hash);            // a transaction with its receipt
client.data.block(number = "latest");     // a block header
client.data.token(address, holder?);      // ERC-20 metadata + holder balance
client.tx.simulate({ to, from?, valueWei?, data? });
```

## Errors

Every failure is a `HoodStackError` with a stable code, so you branch on the code
rather than parsing strings. Network failures surface as a retryable
`HS_PROVIDER_UNAVAILABLE`.

```ts
import { isHoodStackError } from "@hoodstack/sdk";

try {
  await hoodstack.data.transaction(hash);
} catch (error) {
  if (isHoodStackError(error)) {
    error.code; // "HS_INVALID_API_KEY", "HS_RATE_LIMITED", ...
    error.retryable;
    error.docsUrl;
  }
}
```

## Documentation

Full docs and the API reference: [hoodstack.io/docs](https://www.hoodstack.io/docs).

## License

Apache-2.0
