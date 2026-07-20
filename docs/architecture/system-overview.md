# System overview

How HoodStack is structured and why. Describes the target Phase 1 architecture;
see the README for what is currently implemented.

## What HoodStack is

Developer infrastructure between an application and Robinhood Chain. It provides
accounts, authentication, transaction orchestration, gas sponsorship, token
utilities, chain data, webhooks, policies, automation, and developer tooling
through one platform.

It is not a wallet-as-a-service product. Wallet infrastructure is one layer.

## Layers

```
┌──────────────────────────────────────────────────────────────────┐
│  APPLICATION                                                     │
│  DeFi · Payments · RWA · Stock tokens · Consumer · Agents        │
└───────────────────────────┬──────────────────────────────────────┘
                            │  @hoodstack/sdk · react · server · cli
┌───────────────────────────▼──────────────────────────────────────┐
│  HOODSTACK                                                       │
│                                                                  │
│  Identity ──── Execution ──── Gas ──── Assets                    │
│  auth          transactions   policies  tokens                   │
│  accounts      simulation     budgets   registry                 │
│  sessions      batching       limits    metadata                 │
│                                                                  │
│  Connectivity ─ Automation ─── Security ─ Network                │
│  data           agents         policies   usage                  │
│  webhooks       workflows      audit      credits                │
│  events         treasury       controls   entitlements           │
└───────────────────────────┬──────────────────────────────────────┘
                            │  provider adapters
┌───────────────────────────▼──────────────────────────────────────┐
│  ROBINHOOD CHAIN                                                 │
│  RPC · ERC-4337 · Contracts · Blockscout · Assets · Settlement   │
└──────────────────────────────────────────────────────────────────┘
```

## Deployables

| Unit            | Responsibility                                           |
| --------------- | -------------------------------------------------------- |
| `apps/platform` | Next.js: marketing, product pages, docs, auth, dashboard |
| `apps/api`      | Versioned HTTP API under `/v1`                           |
| `apps/worker`   | Webhook delivery, scheduled jobs, indexing, retries      |
| PostgreSQL      | Primary datastore                                        |
| Redis           | Rate limiting, caching, queues                           |

A modular monolith rather than microservices (ADR 0001). The worker is separate
because a slow webhook retry must not occupy an API request handler.

## Package dependency graph

Acyclic, and deliberately layered so a leaf change cannot ripple upward.

```
                        design-tokens
                              │
                             ui ──────────┐
                                          │
  errors ──┬── network ──┬── accounts ────┤
           │             ├── transactions ┤
           │             ├── gas ─────────┤
           │             ├── tokens ──────┤
           │             └── data ────────┤
           │                              │
           ├── logging                    │
           ├── config  (module registry)  │
           ├── database ── usage ── credits│
           └── webhooks                   │
                                          │
                    ┌─────────────────────┴──────────┐
                    │                                │
                   sdk (browser)              server (privileged)
                    │                                │
                  react                             cli
```

Rules:

- `errors` depends on nothing. Everything depends on it.
- `network` depends only on `errors` and viem. It is the chain-truth layer.
- `sdk` is browser-safe. It cannot import `server` or `database`.
- `server` may hold privileged credentials. It never ships to a browser.
- `config` (the module registry) has zero runtime dependencies so both the
  marketing site and the app can import it cheaply.

The browser/server split is enforced by package boundaries, not convention. A
server secret cannot reach a client bundle by importing the wrong thing.

## Request path

A sponsored transaction, end to end:

```
client
  │  SDK call, project API key
  ▼
API boundary        authn · origin check · rate limit · size limit · Zod
  │                 request ID assigned here and carried throughout
  ▼
tenant resolution   project + environment; every later query is scoped
  ▼
policy evaluation   spend limits · allowlists · gas budget · credits
  │                 SERVER-SIDE. A client check is UX, never a control.
  ▼
build + simulate    typed builder → simulation → readable summary
  ▼
chain validation    chain ID verified; mainnet write gate
  ▼
sponsorship         paymaster adapter → decision recorded with reason
  ▼
submit              bundler adapter - never retried blindly
  ▼
track               receipt polling to configured confirmation depth
  ▼
emit                usage event · credit debit · audit event · webhook
```

Each stage can reject with a stable `HS_*` code. Nothing downstream of policy
evaluation can widen what policy allowed.

## Data model

Core entities: `User`, `Identity`, `Session`, `Device`, `Organization`,
`OrganizationMember`, `Project`, `Environment`, `ApiKey`, `AllowedOrigin`,
`Account`, `AccountOwner`, `UserOperation`, `Transaction`, `GasPolicy`,
`GasUsage`, `WebhookEndpoint`, `WebhookSubscription`, `WebhookDelivery`,
`AuditEvent`, `UsageEvent`, `UsageAggregate`, `CreditLedgerEntry`,
`FeatureFlag`, `ProviderConfiguration`, `AccessRequest`.

Invariants:

- **Opaque IDs.** Non-sequential public identifiers; nothing enumerable.
- **Tenant scoping at the data layer.** Not by callers remembering a filter.
- **Hashed API keys.** Plaintext shown once, never retrievable.
- **Encrypted provider secrets.** Key held outside the database.
- **Append-only ledgers.** `CreditLedgerEntry` and `AuditEvent` are never updated
  or deleted; balance is a fold over entries. A ledger you can edit is not a
  ledger, and an audit log you can edit is worthless during an incident.
- **Identity separate from key ownership.** A user changes how they sign in
  without changing what they control (ADR 0003).

## Chain interaction

`@hoodstack/network` is the single source of chain truth: definitions, chain-ID
validation, explorer links, RPC health, endpoint resolution.

Non-negotiable behaviours, implemented and tested:

- Testnet is the default. Mainnet writes require explicit per-project opt-in.
- Chain ID is validated before signing and again before submission - a wallet
  can switch networks in between.
- Only safelisted read methods retry. `eth_sendRawTransaction` never does: a
  broadcast can time out _after_ acceptance, so a retry can double-submit.
- Endpoint fallback refuses non-read methods, for the same reason.
- JSON-RPC application errors are not retried; only transient codes are.
- Public RPC endpoints are not a production default - production resolution
  without configuration throws rather than degrading silently.
- RPC URLs are redacted everywhere they might be logged.
- Confirmation depth is policy, and mainnet is more conservative than testnet.
- Reorgs are a real condition. Chain-derived state updates are idempotent and
  finality-aware.

## Providers

HoodStack operates no bundler, no paymaster liquidity, no indexer, no RPC
infrastructure, and no MPC or HSM custody. Each is a third party behind an
adapter (ADR 0002), which normalizes errors, makes capability explicit and
detectable, enables testing without network access, and keeps provider choice a
configuration decision.

This must be reflected accurately in all documentation and marketing.

## Cross-cutting

**Errors.** One `HoodStackError` type, stable `HS_*` codes, category, HTTP
status, retryable flag, request ID, documentation URL, and details redacted at
construction. Stack traces, SQL, credentials, and tenant data never cross a
trust boundary.

**Observability.** Structured JSON logs, request IDs threaded through every
layer, OpenTelemetry traces, and metrics for API and RPC latency, provider error
rates, user-operation lifecycle, confirmation time, webhook delivery, queue
depth, gas spend, sponsorship rejections, auth failures, rate limits, and credit
consumption. `/health/live` and `/health/ready`; no sensitive diagnostics
publicly.

**Usage and credits.** Metered from recorded events, never estimated. Credits are
non-transferable and offchain, and the platform works with no token (ADR 0004).

## Frontend

One Next.js application with route groups for `(marketing)`, `docs`, `auth`, and
`app`. Public pages are server-rendered with minimal client JavaScript; private
tenant data is never cached across users.

Design language is stacked execution planes, traces, and structured technical
geometry - built with SVG and CSS, not raster or generated art. Dark mode is the
primary identity with a real light mode. WCAG 2.2 AA is the target.

## Deliberate non-goals for Phase 1

Multi-chain support, a decentralized operator network, a deployed token
contract, custody, and proprietary infrastructure. Robinhood Chain remains the
primary identity.
