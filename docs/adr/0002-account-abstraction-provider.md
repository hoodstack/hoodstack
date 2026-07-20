# ADR 0002: Account abstraction through a provider adapter

- **Status:** Accepted (provider selection deferred)
- **Date:** 2026-07-19

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
