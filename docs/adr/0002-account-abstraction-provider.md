# ADR 0002: Account abstraction through a provider adapter

- **Status:** Accepted; **Kernel + Pimlico approved 2026-07-27**. Spike in progress.
- **Date:** 2026-07-19 (evaluation appended and provider approved 2026-07-27)

## Context

HoodStack offers ERC-4337 smart accounts on Robinhood Chain. That requires a
smart-account implementation, a bundler, and a paymaster.

Three options: write our own account contracts and run our own infrastructure;
depend directly on one provider; or define an adapter interface and implement it
per provider.

## Decision

**Adapter interface, with a reputable third-party account implementation behind
it.** HoodStack writes no novel account contracts and operates no bundler or
paymaster.

```ts
interface SmartAccountAdapter {
  createAccount(input: CreateAccountInput): Promise<SmartAccount>;
  getAddress(input: AccountReference): Promise<Address>;
  buildUserOperation(input: BuildUserOperationInput): Promise<UserOperation>;
  estimateUserOperation(input: UserOperation): Promise<UserOperationEstimate>;
  sendUserOperation(input: UserOperation): Promise<UserOperationResult>;
  waitForUserOperation(hash: Hash): Promise<UserOperationReceipt>;
}
```

Which provider ships first is deliberately not decided here. That choice depends
on actual Robinhood Chain support and operational testing, and the adapter exists
so it is not an irreversible decision.

## Rationale

**Why not our own account contracts.** A smart account holds user funds. A bug in
one is unrecoverable and unpatchable for already-deployed accounts. Existing
implementations have years of production exposure and multiple independent
audits. Writing our own would mean shipping unaudited contracts that custody
funds, to save a dependency. That trade is indefensible.

**Why not depend on a provider directly.** Provider APIs differ in error shapes,
gas estimation, paymaster integration, and capability. Threading those
differences through application code makes the provider unremovable - and
provider risk is real: outages, pricing changes, chain support changes, and
companies that shut down.

**Why an adapter.** It normalizes errors into `@hoodstack/errors` codes so
callers branch on stable codes rather than parsing upstream strings. It makes
provider capability explicit and detectable rather than assumed. It lets us test
against a fake without network access. And it keeps provider selection a
configuration decision rather than an architectural one.

The cost is an abstraction layer that can leak, and a lowest-common-denominator
risk if we design for the intersection of provider features. We mitigate the
second with explicit capability detection: a provider that supports deterministic
address prediction advertises it, rather than the interface pretending nobody
does.

## Consequences

- HoodStack must not claim to operate a bundler, paymaster liquidity, or
  proprietary account infrastructure. It does not. Marketing and documentation
  must reflect this.
- Provider credentials are platform secrets: encrypted at rest, never in a
  browser bundle, never in an error.
- Provider downtime is a first-class condition with defined degradation.
- Users must be able to understand what the provider can do unilaterally. Trust
  assumptions get documented per adapter.

## Open question requiring owner input

Provider selection. Candidates depend on confirmed Robinhood Chain support and
should be evaluated on: chain support, bundler reliability, paymaster model and
pricing, account implementation audit history, key-custody model, exportability
of accounts, and whether accounts remain usable if HoodStack disappears.

That last criterion is a hard requirement. A user's account must not become
inaccessible because we stopped operating.

---

## Evaluation and recommendation (2026-07-27)

This resolves the open question above. It is grounded in live reads against
Robinhood Chain, not vendor marketing.

### On-chain findings (verified via RPC, both networks)

The standard ERC-4337 stack is **already deployed** on Robinhood Chain, testnet
(46630) and mainnet (4663):

| Contract | Testnet 46630 | Mainnet 4663 |
| --- | --- | --- |
| EntryPoint v0.6 / v0.7 / v0.8 | deployed | v0.6 + v0.7 deployed |
| SimpleAccountFactory v0.7 | deployed | deployed |
| Kernel v3 factory (ZeroDev) | deployed | deployed |
| Safe 4337 Module + Proxy Factory | deployed | deployed |
| Deterministic deployer, Multicall3 | deployed | (deployer assumed) |

**Implication.** We do not deploy or self-host an EntryPoint, and we do not need
to deploy an account factory: Kernel, Safe, and SimpleAccount are all live. The
account layer is turnkey. The only infrastructure left is a **bundler** and a
**paymaster**.

### What is actually left to build

1. **Bundler** - submits UserOperations to the EntryPoint. Either a hosted
   bundler that supports chain 46630/4663, or a self-hosted open-source bundler
   (Pimlico Alto or Alchemy Rundler) pointed at the Robinhood RPC. Because the
   EntryPoint is on-chain, self-hosting always works as a fallback.
2. **Paymaster** - sponsors gas for the Gas module. Either a hosted paymaster, or
   a verifying paymaster we deploy and fund with ETH, with sponsorship gated by
   the **Policies** module we already shipped.
3. **Adapter** - implement the `SmartAccountAdapter` above for the chosen account,
   normalizing errors to `HS_` codes, then wire it to the modules.

### Options - account layer

- **Kernel v3 (ZeroDev) - recommended.** Deployed on both networks; the strongest
  session-key and permissions story of the three, which is exactly what the
  Sessions and Automation modules need; multiple audits; a standard, widely
  supported implementation, so an account stays operable by any 4337 tooling.
- **Safe (4337 Module).** Deployed; the most battle-tested custody contract; heavier
  and multi-sig oriented; session keys come via add-on modules. A strong choice if
  we later target treasury-grade accounts.
- **SimpleAccount.** Deployed; minimal and cheap, but no session keys, so it cannot
  back Sessions or Automation. Not sufficient.

### Options - bundler and paymaster

- **Pimlico (Alto bundler + verifying paymaster) - recommended.** Account-agnostic
  via permissionless.js (works with Kernel). Alto is open source and self-hostable,
  so we are never locked out by hosted chain-support gaps - the decisive factor for
  the "usable if HoodStack disappears" requirement.
- **ZeroDev (bundler + paymaster + Kernel).** Most integrated for Kernel with
  excellent DX; leans on hosted infrastructure; verify Robinhood support.
- **Alchemy Account Kit / Rundler.** Rundler (Rust) is open source and self-hostable;
  Alchemy's hosted service is unlikely to support a niche chain.
- **Fully self-hosted (Alto or Rundler + our own verifying paymaster).** Maximum
  control, maximum ops. The guaranteed-to-work fallback since the EntryPoint is live.

### Recommendation

- **Signer:** the Privy embedded wallet we already run. It owns the smart account
  and its key is exportable, which preserves user access if we disappear.
- **Account:** Kernel v3 (on-chain, session keys, audited, standard).
- **Bundler + paymaster:** Pimlico - hosted if it supports 46630/4663, otherwise
  self-host Alto and deploy a verifying paymaster funded in ETH, with sponsorship
  bounded by the Policies module.
- **Adapter:** a Kernel + Pimlico implementation of `SmartAccountAdapter`, with
  capability flags for deterministic address prediction and session keys.

Rationale: it reuses Privy; Kernel session keys directly unblock Sessions and
Automation; Pimlico/Alto being self-hostable removes provider lock-in and meets the
hard survivability requirement; and nothing novel custodies funds.

### How it unblocks the roadmap

- **Accounts:** real smart-account creation and deterministic address prediction.
- **Transactions:** build, sign, and submit a UserOperation. The simulate we already
  shipped becomes the pre-flight check.
- **Gas:** the verifying paymaster sponsors UserOperations, bounded by the Policies
  rules (max value, recipient allowlist) already built.
- **Sessions:** Kernel session keys - scoped permissions with expiry.
- **Automation:** session keys plus a scheduler.

### First build step (one spike proves the whole stack)

A testnet-only script, behind a feature flag, that:

1. Selects a bundler: Pimlico hosted for 46630 if supported, else `docker run` Alto
   against the Robinhood testnet RPC.
2. Ensures a funded verifying paymaster (hosted, or deploy ours and fund with faucet
   ETH).
3. Uses permissionless.js to derive a Kernel account owned by a test EOA, builds a
   no-op UserOperation (self-call, zero value), sponsors it, sends it through the
   bundler to EntryPoint v0.7, and waits for the receipt.

One confirmed UserOperation validates EntryPoint + Kernel + bundler + paymaster on
chain 46630. Then implement the adapter and wire Accounts, Transactions, Gas, and
Sessions in that order.

### Must verify before committing spend

- Hosted-bundler support for 46630 and 4663. If absent, self-host Alto; the on-chain
  EntryPoint guarantees this path works.
- Current provider pricing (bundler operations and paymaster gas markup) and the
  paymaster funding model. Not stated here to avoid quoting stale numbers; confirm
  live before enabling on mainnet.
- Privy embedded-wallet key-export terms, which back the survivability guarantee.

### Consequence to revisit

Consequence #1 above says HoodStack operates no bundler or paymaster. The hosted
path keeps that true. The self-hosted path does not: we would then operate a bundler
and hold paymaster liquidity, and the marketing and docs must say so. Choose this
deliberately with the provider decision.

---

## Decision and spike (2026-07-27)

**Approved: Kernel account + Pimlico bundler/paymaster**, signer = Privy embedded
wallet, with self-hosted Alto as the fallback. See the recommendation above.

The spike lives in [`examples/aa-spike`](../../examples/aa-spike). Its first half
is verified live on Robinhood testnet:

- A Kernel v3 smart account was derived deterministically for a test owner and
  confirmed counterfactual (not yet deployed).
- Robinhood-specific finding: the Kernel **meta-factory** is not deployed on
  chain, but the Kernel **factory** is, so accounts are addressed with
  `useMetaFactory: false`. This is exactly the kind of chain detail the spike
  exists to surface, and it is now handled.

The second half, sending one sponsored UserOperation, is coded and ready. It
needs a bundler+paymaster endpoint for chain 46630 (hosted Pimlico or a local
Alto) and a funded paymaster, which are provisioning steps, not code. One
confirmed UserOperation validates EntryPoint + Kernel + bundler + paymaster; then
the `SmartAccountAdapter` and the write-path modules (Accounts, Transactions,
Gas, Sessions) wire up in order.
