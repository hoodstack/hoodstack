# ADR 0003: Non-custodial key management boundary

- **Status:** Accepted
- **Date:** 2026-07-19

## Context

A wallet infrastructure platform must decide whether it can move user funds.
This is the single most consequential decision in the architecture, and it is
extremely difficult to reverse: custody changes the regulatory position, the
threat model, the insurance requirements, and what an attacker gains by
compromising the platform.

## Decision

**HoodStack cannot move user funds.** No mechanism exists, and none will be
added without a superseding ADR.

Specifically:

1. No private key, mnemonic, or seed phrase is stored, in any form, encrypted or
   otherwise.
2. No administrative path can sign on a user's behalf.
3. No recovery flow yields platform control of an account.
4. Governance cannot move user funds - architecturally, not by policy.
5. Users can export or continue using their accounts if HoodStack ceases to
   exist.
6. No HoodStack token is required to create an account, sign in, recover access,
   export an account, withdraw funds, or perform any account-safety operation.

Point 6 is a hard boundary between the token system and the safety of a user's
own funds.

## Rationale

**Blast radius.** With custody, a platform compromise means fund loss. Without
it, the same compromise means a service outage and a data-exposure problem -
serious, but recoverable. This changes what an attacker gets for a successful
attack, which changes how much attack we attract.

**Honesty.** HoodStack has no HSMs, no MPC infrastructure, and no audits.
Custody with that posture would be indefensible. Declining custody means we do
not have to make security claims we cannot support.

**Regulatory position.** Custody of assets is a regulated activity in most
jurisdictions. Non-custody keeps HoodStack squarely in developer tooling, which
is what it is.

**Not becoming a hostage.** Non-custody means account access does not depend on
HoodStack staying in business, staying online, or staying friendly. Users
holding funds in accounts we could freeze would be a worse product regardless of
our intentions.

## Consequences

- Some features are unavailable. Server-side signing without user involvement is
  not possible. Recovery cannot be "we restore your key." These are accepted
  limits, not gaps to fill.
- Recovery must be built from user-controlled factors and account-level recovery
  mechanisms, not platform key escrow.
- Agent and automation features must be built from scoped, expiring, delegated
  permissions - cryptographic constraints the user grants, not platform custody.
- Where a provider participates in signing, its exact capability is documented so
  users know their real trust assumptions. "Non-custodial" must not become a
  word that hides a provider who is effectively custodial.
- Marketing must never imply custody, insurance, or fund protection.

## Verification

This is enforceable and must be enforced, not assumed:

- No code path persists key material. Reviewed on every change touching accounts.
- Redaction strips key-shaped fields from errors and logs by default.
- Secret scanning in CI.
- Any PR introducing key storage requires a superseding ADR before merge.

## Reversal

Adding custody would require a new ADR, a legal review, an independent security
audit, an HSM or MPC deployment, an insurance assessment, and explicit user
consent for affected accounts. It would not be a quiet feature addition.
