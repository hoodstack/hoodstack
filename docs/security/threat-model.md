# Threat model

Public document. It describes what HoodStack defends against and how. It
deliberately omits operational detail - infrastructure topology, alert
thresholds, key locations, and incident specifics are not published.

## Scope

HoodStack is developer infrastructure sitting between an application and
Robinhood Chain. It handles identity, smart accounts, transaction construction,
gas sponsorship, chain data, webhooks, and policy enforcement.

HoodStack **does not** custody user funds and **does not** hold user private
keys. That single decision removes the largest class of catastrophic failure
available to a platform in this position, and it constrains everything else in
this document.

## Trust boundaries

```
  Browser / user device        ← untrusted. Anything here is attacker-controlled.
        │
        ▼
  HoodStack public API         ← boundary 1: authn, authz, validation, limits
        │
        ▼
  HoodStack services + DB      ← boundary 2: tenant isolation, secret handling
        │
        ▼
  Provider adapters            ← boundary 3: RPC, bundler, paymaster, indexer
        │
        ▼
  Robinhood Chain              ← boundary 4: consensus, finality, reorgs
```

A client is never trusted to enforce a policy. Every limit that matters -
spend caps, allowlists, sponsorship rules, rate limits - is evaluated
server-side, before anything is signed. A client-side check is a UX affordance,
never a control.

## Actors

| Actor                 | Capability assumed                                             |
| --------------------- | -------------------------------------------------------------- |
| Anonymous internet    | Full access to public endpoints; can craft any request         |
| Application developer | Holds valid API keys for their own projects only               |
| End user              | Controls their own device, session, and authentication factors |
| Autonomous agent      | Holds delegated, scoped, expiring permissions                  |
| Malicious contract    | Can be the target of any call HoodStack constructs             |
| Compromised provider  | RPC, bundler, paymaster, or indexer returning hostile data     |
| Malicious insider     | Holds some production access                                   |

## Threats and mitigations

### Credentials and identity

**API key theft.** Keys are stored hashed, never in plaintext. They carry an
identifiable prefix so a leaked key can be recognized in a paste site or log and
revoked fast. They are shown in full exactly once, at creation. Keys are scoped
to one project and one environment, so a leak from a test environment does not
expose production.

**Session hijacking.** Session cookies are `HttpOnly`, `Secure`, and
`SameSite=Lax` or stricter. Sessions are revocable individually and in bulk, and
every device and session is listed to the user. Privilege changes invalidate
existing sessions.

**CSRF.** State-changing requests require a CSRF token bound to the session, and
the `Origin` header is validated against the project's allowed origins. Cookie
`SameSite` is defence in depth, not the primary control.

**Account-linking takeover.** Linking a new authentication method to an existing
identity is the most dangerous operation in the auth system: it grants permanent
access. Linking requires re-authentication with an already-trusted factor,
notifies every other registered factor, and is recorded as an audit event. An
unverified email is never sufficient to link.

**Passkey recovery abuse.** Recovery is the weakest point of any passkey system -
it exists precisely to bypass the strong factor. Recovery therefore requires
multiple independent signals, imposes a delay during which every registered
device is notified, and is cancellable by any surviving factor. Support staff
cannot unilaterally complete a recovery.

### Multi-tenancy

**Cross-tenant data access.** Every query is scoped by tenant at the data-access
layer, not by callers remembering to add a filter. Public identifiers are opaque
and non-sequential, so an ID cannot be guessed or enumerated. Tenant isolation
has dedicated tests, because a regression here is silent.

**Privilege escalation.** Roles are checked server-side per request. A member
cannot grant themselves a role they do not hold, and role changes are audited.

### Chain interaction

**Chain mismatch.** A signature produced for one network can be valid on
another. Chain ID is validated immediately before signing and again before
submission, because a wallet can switch networks between those two moments.

**Malicious contract calls.** Transactions are simulated before signing where
technically possible, and the user is shown a readable summary of what will
happen rather than opaque calldata. Contract and recipient allowlists are
enforced server-side.

**Address poisoning.** Addresses are displayed in full or with sufficient
disambiguating characters, never truncated to a few leading digits that a
lookalike address can match. Recipients drawn from transaction history are
marked with their provenance.

**Malicious token metadata.** Token symbols and names are attacker-controlled
strings. They are rendered as untrusted text, never as markup, and are never
used as an identifier. Assets are identified by chain ID plus contract address.
A canonical registry records the source and verification date of every entry;
an unverified asset is displayed as unverified.

**User-operation replay and nonce conflicts.** Nonces are tracked per account.
A user operation is bound to its chain and account, and a nonce conflict is
surfaced as a distinct, retryable condition rather than a generic failure.

**Blockchain reorganizations.** A confirmation is not a fact; it is a
probability that increases with depth. Nothing is treated as final until it
satisfies the configured confirmation depth, and mainnet is more conservative
than testnet. Event indexing must be reorg-safe: entitlement and credit updates
derived from chain events are idempotent, so replaying a reorganized range
cannot double-count.

**Stale indexed data.** Indexed data lags the chain. Reads that must be current
go to RPC; indexed reads carry their as-of block so a caller can tell how stale
they are. A stale indexer must not silently answer a question that requires
current state - for example, a balance check gating a transfer.

### Gas sponsorship

**Gas draining.** Sponsorship is the platform's most directly monetizable
attack surface: an attacker who can trigger sponsored transactions spends real
money. It is bounded on every axis - per-user limits, per-project budgets,
contract and method allowlists, recipient rules, value ceilings, and rate
limits - and every sponsorship decision is recorded with its reason. A project
kill switch stops sponsorship immediately.

**Sybil abuse.** Per-user limits are meaningless if users are free to create.
Sponsorship policy is expected to be paired with an application-level identity
signal; HoodStack cannot solve this alone and does not claim to.

### Webhooks

**Forgery.** Payloads are signed with a per-endpoint secret. Consumers verify
using a constant-time comparison.

**Replay.** Signatures cover a timestamp, and payloads outside a tolerance
window are rejected. Delivery IDs let a consumer detect duplicates, since
at-least-once delivery means duplicates are normal, not exceptional.

**Secret rotation.** Rotation supports an overlap window so an endpoint can
accept both secrets during a deploy, rather than forcing a flag-day change that
drops events.

**SSRF via webhook URLs.** Webhook destinations are user-supplied URLs that the
server fetches - a direct SSRF primitive. Destinations are restricted to public
addresses; loopback, link-local, and private ranges are rejected, and the check
is applied after DNS resolution to defeat rebinding.

### Providers

**Provider downtime.** Every external dependency is behind an adapter with
timeouts, bounded retries, and health checks. Reads fail over across endpoints.
Writes never fail over, because failing a broadcast over to a second node risks
submitting it twice. When sponsorship is unavailable the system degrades to
unsponsored execution rather than failing silently.

**Hostile provider responses.** Provider output is untrusted input. It is
validated before use, and provider errors are normalized so an upstream error
shape never leaks to a caller.

**Provider credential exposure.** RPC URLs routinely embed API keys. URLs are
redacted before appearing in any error, log, or health report.

### Platform

**XSS.** A strict Content Security Policy, no `dangerouslySetInnerHTML` on
untrusted content, and framework-level escaping. Chain-derived strings - token
symbols, ENS-style names, contract metadata - are treated as hostile.

**SQL injection.** Parameterized queries via the ORM. No string-built SQL.

**Injection into logs.** Log fields are structured, not concatenated, so a
crafted value cannot forge a log line.

**Request flooding and oversized payloads.** Request size limits and rate limits
at the edge and per API key. Rate-limit events are recorded.

**Dependency compromise and confusion.** A committed lockfile, verified in CI.
Automated dependency and secret scanning. Scoped package names, published with
provenance where available.

**Insider risk.** Least privilege on production access, audit logs for
privileged actions, and append-only audit storage so the record of an incident
cannot be edited after it.

## Explicit non-goals

HoodStack does not defend against:

- a compromised end-user device
- a user approving a transaction they were socially engineered into approving,
  beyond showing an accurate simulation and summary
- consensus-level failure of Robinhood Chain
- volumetric denial of service against upstream public infrastructure

## Assumptions

If any of these is false, conclusions in this document may not hold.

1. Providers behave correctly or fail visibly. A provider that returns
   plausible-but-wrong data is only partly detectable.
2. Robinhood Chain finality behaves as documented for an Arbitrum-technology L2.
3. Underlying cryptographic primitives are sound. HoodStack implements no
   cryptography of its own.
4. Operators keep production credentials on managed, patched machines.

## Review

This document is revised when the architecture changes, when a new provider or
trust boundary is introduced, and after any incident. It describes intent for
components not yet built - see the README for what is actually implemented.
