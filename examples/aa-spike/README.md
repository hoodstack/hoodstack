# AA spike

The account-abstraction proof for HoodStack on Robinhood Chain, per
[ADR 0002](../../docs/adr/0002-account-abstraction-provider.md). Kernel account,
Privy-style EOA owner, Pimlico (or self-hosted Alto) bundler + paymaster.

## Part 1: derive (no infra, no funds)

Derives a Kernel smart account on testnet and confirms it is counterfactual.
This is verified working: the Kernel factory is deployed on Robinhood Chain, so
`useMetaFactory: false` addresses through it (the meta-factory is not deployed).

```
pnpm --filter @hoodstack/example-aa-spike derive
```

## Part 2: spike (needs a bundler + a funded paymaster)

Sends one sponsored no-op UserOperation and waits for the receipt. One confirmed
UserOp validates EntryPoint + Kernel + bundler + paymaster on chain 46630.

Provision first:

- `SPIKE_PRIVATE_KEY`: any owner EOA (the smart account is derived from it).
- `PIMLICO_BUNDLER_URL`: a bundler+paymaster endpoint that supports chain 46630.
  Get one from the Pimlico dashboard, or run Alto locally against the testnet RPC.
- Fund the paymaster (or the account) with testnet ETH from the faucet.

```
PIMLICO_BUNDLER_URL=… SPIKE_PRIVATE_KEY=… pnpm --filter @hoodstack/example-aa-spike spike
```

## After it is green

Implement the `SmartAccountAdapter` from ADR 0002 as a Kernel + Pimlico adapter,
then wire Accounts (real creation), Transactions (submit), Gas (paymaster
sponsorship bounded by Policies), and Sessions (Kernel session keys), in order.
