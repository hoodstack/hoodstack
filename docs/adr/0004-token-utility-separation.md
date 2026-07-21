# ADR 0004: Separating token accounting from platform safety

- **Status:** Accepted
- **Date:** 2026-07-19

## Context

HoodStack plans a token that coordinates infrastructure usage - developer
capacity, sponsored gas entitlements, operator bonding, agent collateral.

The failure mode to avoid is well documented across the industry: a token that
becomes load-bearing for basic product function. Users then cannot use the
product without acquiring it, cannot recover accounts without it, and cannot
withdraw funds if its systems fail.

No token has been launched. No contract has been deployed.

## Decision

**Token accounting is a separate system from platform operation, and the
platform is fully functional without it.**

Four rules:

1. **The product works with no token.** Every Phase 1 capability functions
   without any token existing. This is verified by the token not existing yet.

2. **The token never gates safety.** Creating a wallet, signing in, recovering
   access, exporting an account, withdrawing funds, and any ordinary account
   safety operation are permanently token-free. See ADR 0003.

3. **Credits are the primary abstraction; the token is one funding source.**
   Service capacity is denominated in usage credits - non-transferable,
   non-tokenized, offchain, append-only, tied to real consumption. Credits can be
   funded by free allocation, promotion, manual grant, or conventional payment.
   After launch, a token entitlement adapter becomes an _additional_ funding
   source, translating verified stake or token payment into credits.

4. **Conventional payment is always available.** Paying with fiat or stablecoin
   is never removed. No capacity tier is token-only.

## Rationale

**The adapter boundary is what makes this safe.** Because capacity is spent as
credits, the metering, quota, and billing systems never learn about the token.
A failure in token accounting - a stalled indexer, a reorg, a contract pause -
degrades one funding path. It cannot prevent someone from using the platform or
touching their funds.

**It also keeps the product honest before launch.** Building credits first
forces the capacity system to stand on its own. A token bolted on later adds a
funding source; it does not rescue a system that was never viable without it.

**Reorg safety.** Entitlements derived from chain events must be idempotent and
finality-aware, or a reorganization double-counts. Keeping this logic in one
adapter confines that difficulty to one testable place.

## Consequences

- Credits ship in Phase 1 with no token dependency.
- The token entitlement adapter is additive, built in Phase 2.
- Token-derived capacity is reconciled against finalized chain state only.
- Token accounting is separate from authentication, wallet ownership, recovery,
  and user balances.
- Governance is bounded: it may control grants, supported modules, operator
  requirements, treasury policy, and fee ranges. It may never control user keys,
  user balances, arbitrary user transactions, recovery without user
  authorization, or unrestricted contract upgrades.

## Communication constraints

Token documentation is technical architecture, not an offer.

Prohibited on every surface: price predictions, market-cap targets, guaranteed
buybacks, APY promises, revenue-sharing promises, exchange listings, countdowns,
and fabricated staking figures.

`$STACK` is a provisional internal identifier only. Ticker, supply, allocation,
vesting, launch date, deployment address, liquidity strategy, and exchange plans
are undetermined and must not appear anywhere until explicitly supplied.

Until launch, `/products/token-utility` and `/app/[projectId]/token-utility`
state clearly that no token exists. They show real usage, real credit balance,
and the intended entitlement architecture - never a fake balance, fake stake,
fake APR, fake rewards, or fake governance proposals. The routes survive launch
unchanged.
