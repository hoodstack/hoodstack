# Key management

Public document describing the boundaries HoodStack holds around key material.
Operational specifics - where keys live, who holds which role, rotation
schedules - are not published.

## The central decision

**HoodStack does not custody user private keys and does not hold user funds.**

Every other choice here follows from that. A platform that custodies keys must
solve secure storage, insider risk, compelled disclosure, and the operational
burden of being a target worth attacking. Declining custody removes that class
of problem rather than mitigating it.

Concretely:

- No private key, mnemonic, or seed phrase is stored in plaintext, anywhere,
  ever - not in a database, a log, an error, a cache, or an environment variable.
- HoodStack cannot move a user's funds. There is no mechanism, no admin path,
  and no recovery flow that produces one.
- Governance cannot move user funds either. That constraint is architectural,
  not a policy that could later be voted away.

## Categories of key material

Different material has different handling. Conflating them is how leaks happen.

### 1. User signing keys - not held

Held by the user's wallet, passkey authenticator, or the account-abstraction
provider under the user's control. HoodStack constructs and validates payloads;
it does not sign for users.

Where a provider participates in signing, that is stated plainly in the provider
adapter's documentation, including what the provider can and cannot do
unilaterally. A user's trust assumptions should never be a surprise.

### 2. Platform secrets - encrypted at rest

Provider API keys, webhook signing secrets, and encryption keys.

- Encrypted at rest with a dedicated encryption key held outside the database.
- Never logged, never returned by an API, never included in an error.
- Scoped per project and environment, so compromise is contained.

### 3. API keys - hashed, never recoverable

- Stored as a hash. The plaintext is shown exactly once, at creation, and cannot
  be retrieved afterward. "Show key again" is not a feature; it is a liability.
- Prefixed identifiably (e.g. `hs_test_`, `hs_live_`) so a leaked key is
  recognizable in a log, a repository, or a paste site - and so automated secret
  scanners can match it.
- Revocable immediately, with revocation audited.

### 4. Session material - short-lived and revocable

- `HttpOnly`, `Secure`, `SameSite` cookies. Never readable by JavaScript.
- Individually and bulk revocable; every session is visible to the user.
- Invalidated on privilege change and on credential change.

### 5. Deployment and treasury keys - outside this repository

Signing material for contract deployment or treasury operation is never in the
repository, never in CI, and never in an environment variable in an application
process. `contracts/broadcast/` is gitignored because broadcast logs record
deployment transactions and signer addresses.

No token contract has been deployed. When contract deployment happens, it will
require a multisig with published requirements, and the deployment procedure
will be documented before it is executed, not after.

## Rotation

Everything rotatable is rotatable without downtime, because a rotation
mechanism that requires an outage does not get used in an emergency - which is
exactly when it is needed.

- **API keys** - create the new key, migrate traffic, revoke the old one. Multiple
  active keys per environment are supported for exactly this reason.
- **Webhook secrets** - overlap window during which both the old and new secret
  verify, so consumers can deploy on their own schedule without dropping events.
- **Encryption key** - re-encrypts stored provider secrets. This is a planned
  operation with a documented procedure, not an ad-hoc one.
- **Provider credentials** - rotated at the provider, then updated in
  configuration. Adapters read credentials at use, not at process start, so
  rotation does not require a restart.

Rotation is also the first response to suspected exposure. Rotate first,
investigate second.

## Environment separation

Testnet and mainnet credentials are separate, and never share a key.

Mainnet writes are disabled by default and require an explicit per-project
opt-in with a confirmation step. A configuration mistake, a copied snippet, or a
test pointed at the wrong environment should not be able to spend real funds.

## What is deliberately absent

HoodStack does not claim to operate, and does not operate:

- hardware security modules
- multi-party computation infrastructure
- proprietary custody infrastructure

If any of these is introduced, it will be described here with what it actually
does. Until then, no marketing surface implies otherwise.

## Reporting

Send suspected key exposure to **security@hoodstack.io**. See
[SECURITY.md](../../SECURITY.md).
