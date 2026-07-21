# Implementation plan

Living document. Updated after every milestone.

**Last updated:** 2026-07-19

---

## Status

|                     |                           |
| ------------------- | ------------------------- |
| Phase               | 1 (pre-release)           |
| Milestones complete | 6 of 22                   |
| Test count          | 106 passing               |
| Audited             | No                        |
| Token launched      | No - no contract deployed |
| Production ready    | No                        |

---

## Milestones

Sequenced so each rests on verified foundations. Steps 1-4 are done; the rest are
planned.

### ✅ M1 - Repository inspection and foundation

Empty directory confirmed. Monorepo scaffolded: pnpm workspaces, Turborepo,
strict TypeScript (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`),
Prettier, shared tsconfig bases, Apache-2.0.

`@hoodstack/errors` - stable `HS_*` codes, category, HTTP status, retryable
flag, request ID, docs URL, construction-time redaction, symbol-branded
identification, wire round-trip. 29 tests.

`@hoodstack/network` - Robinhood Chain mainnet (4663) and testnet (46630)
extending viem's `Chain`; chain guards, mainnet write gate, explorer and faucet
helpers, currency formatting, JSON-RPC client with timeout, safelisted retry and
endpoint fallback, RPC health probes, production endpoint resolution. 47 tests.

`@hoodstack/config` - the module registry: 29 modules, 8 categories, derived
navigation, fail-closed gating, integrity tests. 18 tests.

### ✅ M2 - Governing documents

`IMPLEMENTATION_PLAN.md`, `docs/architecture/system-overview.md`, threat model,
key management, incident response, responsible disclosure, `SECURITY.md`, ADRs
0001-0006, `.gitignore`, `.env.example`.

### ✅ M3 - Tooling and CI

ESLint flat config with browser/server import boundaries that mechanically
prevent a browser-safe package importing `@hoodstack/server`,
`@hoodstack/database`, or a Node built-in. GitHub Actions: install with
`--frozen-lockfile`, format, lint, typecheck, test, build, dependency audit,
gitleaks secret scan. Least-privilege permissions, concurrency cancellation.
`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, PR template with
security and honesty checklists, issue templates, CODEOWNERS.

### ▢ M3b - Changesets and release automation

Deferred until a package is close to publishing. Changesets configured against
packages nobody consumes yet would be ceremony without benefit.

### ✅ M4 - Design tokens

`@hoodstack/design-tokens` - CSS custom properties, TypeScript objects, Tailwind
preset. Dark primary with a real light theme, explicit choice overriding system
preference, no flash of wrong theme (inline bootstrap pinned by CSP hash).
Semantic status tokens deliberately distinct from chartreuse, enforced by a test
that fails if a status color collides with the brand scale. 12 tests.

### ▢ M4b - `@hoodstack/ui` package

Primitives currently live in `apps/platform/src/components`. They are extracted
into the published package once real usage has shaped the API - publishing an
interface before the surfaces that consume it exist produces an API that is then
expensive to change.

**Blocked on owner input:** brand vector assets. A placeholder mark is in place
and clearly labelled as such; it must not ship publicly.

### ✅ M5 - Platform shell and navigation

Next.js 15 App Router with `(marketing)` and `app` route groups. Sidebar and
product navigation generated from the module registry, so both cannot drift from
it. Preview-route system per ADR 0006: disabled controls with stated reasons, no
mocked data, honest status copy. Strict CSP, security headers, and `no-store` on
authenticated routes. Skip link, visible focus, reduced-motion support.

### ✅ M6 - Landing page and public product routes

Homepage with hero, SDK preview, "Everything under the hood" visualization
(hand-built SVG/CSS with an accessible definition-list equivalent), product
layers, workflow, chain-native section, security model, and token utility. All
15 public product routes generated from the registry and prerendered. Security,
changelog, and docs index pages. Legal disclaimer visible in the footer of every
marketing page.

Verified by running the production server: 25 routes, all returning 200, headers
present, unknown modules 404, honest copy rendered, all 29 sidebar modules
present.

### ▢ M7 - Data, logging, config packages

`@hoodstack/database` (Drizzle + PostgreSQL), migrations, `@hoodstack/logging`
(structured JSON, redaction, request IDs), `@hoodstack/testing`. Docker Compose
for local Postgres and Redis.

### ▢ M8 - Authentication and tenancy

Email OTP or magic link, WebAuthn passkeys, EVM wallet sign-in. Secure sessions,
device and session management, account linking with re-authentication, audit
events. Organizations, members, roles, projects.

**Tenant-isolation tests are a merge requirement, not a follow-up.**

### ▢ M9 - API keys, environments, versioned API

Hashed keys with identifiable prefixes, shown once. Allowed origins.
Testnet/mainnet environments with the mainnet write gate. `/v1` with OpenAPI,
idempotency keys, cursor pagination, rate limiting, request IDs, audit logging.

### ▢ M10 - Account abstraction adapter

`@hoodstack/accounts` against the interface in ADR 0002. Requires provider
selection.

### ▢ M11 - Transactions and simulation

Typed builders, simulation, readable summaries, receipt polling to configured
depth, the full state machine. Confirmed is reported only on a real receipt.

### ▢ M12 - Gas policies and sponsorship

`@hoodstack/gas`. Policy engine, budgets, allowlists, abuse controls, kill
switch, recorded decisions with reasons, safe degradation when unavailable.

### ▢ M13 - Tokens and canonical registry

`@hoodstack/tokens`. Registry entries carry source, verification method, and
last-verified timestamp. **No canonical address is added without verification
against an authoritative source.**

### ▢ M14 - Data and webhooks

Indexed-data adapter with RPC fallback and as-of block. Signed, timestamped
webhooks with replay protection, retries, dead-lettering, redelivery, rotation
with overlap. SSRF protection on destination URLs, post-DNS-resolution.

### ▢ M15 - Usage metering and credits

Append-only ledger. Balance as a fold over entries. No token dependency.

### ▢ M16 - SDKs and CLI

`@hoodstack/sdk`, `server`, `react`, `cli`. Browser/server split enforced by
lint rules and verified by bundle inspection.

### ▢ M17 - Dashboard

Real functionality only. Onboarding states for empty projects; no sample data.

### ▢ M18 - Documentation and examples

All `/docs` routes. Four example applications, each building in CI. Every code
sample executed before publication.

### ▢ M19 - Security review

Full pass against the threat model. Tenant isolation, webhook signing and replay,
chain mismatch, RPC failure, gas policy, credit ledger, rate limiting.

### ▢ M20 - Deployment

Dockerfiles, Compose, migration and rollback procedures, backup and restore,
credential rotation.

### ▢ M21 - Accessibility and performance

WCAG 2.2 AA audit, Playwright smoke tests, marketing JS budget, no layout shift.

### ▢ M22 - Release gates

Every gate in §67 verified and recorded in a production-readiness report.

---

## Open questions requiring owner input

**1. Brand vector assets - blocks M4.**
The specification requires using the approved HoodStack icon and forbids
redrawing it. No files supplied. Needed: `icon.svg`, `icon-white.svg`,
`icon-black.svg`, `wordmark.svg`, `lockup-horizontal.svg`, `favicon.svg`.
Documented placeholders will be created if not supplied, and must not ship to
production.

**2. Account abstraction provider - blocks M10.**
See ADR 0002. Hard requirement: accounts must remain usable if HoodStack ceases
to operate.

**3. `security@hoodstack.io` must exist before the repository is public.**
`SECURITY.md` publishes this address. A published reporting channel that bounces
is worse than none - it converts a private report into a public disclosure.

**4. Bundler, paymaster, indexer, and email providers.**

**5. Deployment target** - affects Dockerfiles and CI.

**6. Token ticker.** `$STACK` is treated as provisional per §14 and appears in no
user-facing surface.

---

## Known risks

| Risk                                                           | Impact            | Mitigation                                                             |
| -------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------- |
| Robinhood Chain AA provider support unverified                 | High - blocks M10 | Adapter isolates the choice; verify before committing                  |
| Public RPC endpoints rate-limited                              | Medium            | Configurable endpoints; production refuses public defaults             |
| Finality parameters are our policy, not documented chain facts | Medium            | Conservative defaults, configurable, labelled as policy                |
| No canonical asset addresses verified                          | Medium            | Registry ships empty rather than guessed; entries require verification |
| Provider concentration                                         | Medium            | Adapter interfaces; no provider assumed permanent                      |
| Scope is large relative to capacity                            | High              | Sequenced milestones; registry keeps structure stable                  |
| Preview routes could be mistaken for working features          | High              | ADR 0006; fail-closed gating; no mocked responses                      |

---

## Working agreement

After every milestone: format, lint, typecheck, test, build, inspect the diff,
fix failures, update this document, summarize what was completed, and state
unresolved risks.

Standing rules: choose the safer implementation; use an adapter at an external
boundary; document the decision; never fabricate functionality, metrics, or
claims; keep routes stable; keep Robinhood Chain primary.
