# Security policy

## Current security posture

State this plainly, because it determines how you should treat this software:

**HoodStack is pre-release and has not been audited.** No independent security
review has been performed. No formal verification has been performed. No bug
bounty is currently funded.

Do not use HoodStack to secure funds you cannot afford to lose. Do not use it in
production. Mainnet writes are disabled by default and should stay that way
until this section says otherwise.

HoodStack does not describe itself as bank-grade, military-grade, unhackable,
audited, battle-tested, or institutional-grade. None of those claims would be
true, and this document will be updated when any of them becomes verifiable.

## Reporting a vulnerability

Report privately. Do not open a public issue for a security problem.

- Email: **security@hoodstack.io**
- Or use GitHub's private vulnerability reporting on the affected repository.

Please include:

- what the issue is and where in the code it lives
- how to reproduce it, ideally with a minimal case
- what an attacker gains
- any preconditions (network, role, configuration)

See [docs/security/responsible-disclosure.md](docs/security/responsible-disclosure.md)
for scope, safe-harbor terms, and what to expect after reporting.

## Supported versions

HoodStack has not reached 1.0. Only the current `main` branch receives security
fixes. There are no maintained release branches yet.

## What we consider a vulnerability

In scope:

- authentication or session bypass
- cross-tenant data access (one project reading another's data)
- privilege escalation within an organization
- API key or credential exposure
- webhook signature forgery or replay
- gas sponsorship abuse that bypasses configured policy
- chain-mismatch or transaction-substitution flaws
- injection of any kind
- SSRF, especially via configurable RPC or webhook URLs
- secrets reaching a browser bundle or a log

Out of scope:

- findings that require a compromised developer machine
- rate limits on the shared public Robinhood Chain RPC endpoints, which are not
  operated by HoodStack
- missing hardening on endpoints that are documented as unimplemented
- social engineering, physical attacks, and volumetric denial of service

## Security properties we intend to hold

These are commitments the codebase is built around. A defect in any of them is a
vulnerability, not a feature request.

**Key custody.** HoodStack does not store private keys, mnemonics, or signing
secrets in plaintext, and does not custody user funds. See
[docs/security/key-management.md](docs/security/key-management.md).

**Tenant isolation.** A project cannot read or affect another project's data.
Every data access is scoped to a tenant, and this is tested, not assumed.

**Browser/server boundary.** No server secret is reachable from a client bundle.
The boundary is enforced by package structure, not by convention.

**Chain safety.** Chain ID is validated before signing and again before
submission. Mainnet writes require an explicit, per-project opt-in.

**Retry safety.** Non-idempotent operations are never retried automatically. A
transaction broadcast that times out is not re-sent.

**Fail closed.** A missing feature flag, an absent configuration value, or an
unrecognized state disables functionality rather than enabling it.

**Safe errors.** Errors never carry stack traces, SQL, provider credentials,
internal hostnames, or another tenant's data across a trust boundary. Details
are redacted at construction.

## Reporting something that is not a vulnerability

For a fabricated claim, a misleading statement on the website, or documentation
that overstates what works, open a normal public issue. Accuracy about our own
capabilities is a security property too, and we would rather hear about it.
