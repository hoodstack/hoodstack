# HoodStack — project status

Living snapshot of what exists, what is pending, and how we deploy. Updated as we
ship. For the milestone plan see [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md);
for architecture decisions see [docs/adr](docs/adr).

**Last updated:** 2026-07-20

---

## 1. Snapshot

|          |                                                                     |
| -------- | ------------------------------------------------------------------- |
| Phase    | 1 (pre-release)                                                     |
| Posture  | Deploy the marketing site + app shell now; keep shipping agile      |
| Tests    | 117 passing (errors 29 · network 47 · config 29 · design-tokens 12) |
| Pipeline | `lint` · `typecheck` · `test` · `build` all green                   |
| Audited  | No                                                                  |
| Token    | Not launched · no contract deployed                                 |
| Custody  | None — HoodStack cannot move user funds                             |
| Repo     | github.com/hoodstack/hoodstack (private-safe, no secrets)           |

---

## 2. What is built (start → now)

### Foundation packages (implemented + tested)

| Package                    | What it does                                                                                                                                                                                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@hoodstack/errors`        | Stable `HS_*` error taxonomy, category/HTTP/retryable metadata, construction-time redaction, symbol-branded identification, wire round-trip. 29 tests.                                                                                                                                    |
| `@hoodstack/network`       | Robinhood Chain mainnet (4663) + testnet (46630) extending viem's `Chain`; chain-ID validation, mainnet-write gate, explorer/faucet helpers, currency formatting, JSON-RPC client with safelisted retry + endpoint fallback, RPC health probes, production endpoint resolution. 47 tests. |
| `@hoodstack/config`        | Typed product + module registry: 8 products, 32 modules, derived navigation, fail-closed availability gating, route integrity tests. 29 tests.                                                                                                                                            |
| `@hoodstack/design-tokens` | Themed token system (dark + light, no flash), Tailwind preset, self-hosted typography wiring. Status colors distinct from brand. 12 tests.                                                                                                                                                |

### Platform application (`apps/platform`, Next.js 15)

Marketing site, docs subsite, and the authenticated app shell — one deployable.

- **Landing page** — serif display type (self-hosted Fraunces/Inter/JetBrains Mono
  via `next/font`), animated "legacy stack → HoodStack" hero transform, product
  ledger, transaction-lifecycle signal, "Everything under the hood" architecture
  diagram, chain-native section, security posture, capacity/token model, proof
  strip. All motion respects `prefers-reduced-motion`.
- **Products** — `/products` index and `/products/[slug]` hubs + module pages,
  generated from the registry (sticky intros, self-contained module cards).
- **Token utility** — single canonical page at **`/token-utility`**
  (`/products/token-utility` 308-redirects here). Credits-first capacity model,
  seven utility pillars each with its constraint, hard boundaries, before/after
  evolution, `$HOOD` as a provisional identifier only.
- **Security** — posture-first editorial page (numbered guarantees, "what we do
  not claim", reporting scope, disclosure).
- **Changelog** — versioned timeline mirroring `CHANGELOG.md`.
- **Docs** — its own site at `/docs`: distinct header + sidebar, opens in a new
  tab, honest single-page content with working `@hoodstack/network` examples.
- **App shell** — `/app`, `/app/projects`, `/app/[projectId]/*`; permanent
  registry-driven sidebar (8 products + overview/settings), preview-route system
  (disabled controls, `HS_FEATURE_NOT_ENABLED`, no mocked data).
- **Security headers** — strict CSP (dev/prod split), HSTS, frame and content
  protections, `no-store` on authenticated routes.

### Documentation & governance

ADRs 0001–0007, system overview, threat model, key management, incident response,
responsible disclosure, module-activation runbook, `SECURITY.md`,
`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `IMPLEMENTATION_PLAN.md`.

### Tooling & repo

pnpm workspaces + Turborepo, strict TypeScript, ESLint with browser/server import
boundaries, Prettier, GitHub Actions CI (install/lockfile/format/lint/typecheck/
test/build/audit/secret-scan), CODEOWNERS, issue/PR templates, `.gitattributes`,
Apache-2.0. Git configured to commit + push as **@hoodstack** over a dedicated,
isolated SSH key (no personal identity in history).

---

## 3. What is pending

Every module below is present in navigation and honestly marked as preview; the
work is to make it real. None is `enabled` yet.

| Area                            | Milestone | Notes                                                                                       |
| ------------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| Database + migrations           | M7        | Drizzle + PostgreSQL, opaque IDs, append-only ledgers                                       |
| Logging / observability         | M7        | Structured JSON, redaction, request IDs                                                     |
| Authentication + tenancy        | M8        | Passkeys, email, wallet sign-in; orgs/projects; **tenant-isolation tests are a merge gate** |
| API keys + environments         | M9        | Hashed keys, allowed origins, testnet/mainnet gate                                          |
| Versioned API `/v1`             | M9        | OpenAPI, idempotency, rate limits, audit logging                                            |
| Account abstraction             | M10       | Provider adapter (blocked on provider selection — ADR 0002)                                 |
| Transactions + simulation       | M11       | Builders, simulation, receipt polling                                                       |
| Gas policies + sponsorship      | M12       | Policy engine, budgets, kill switch                                                         |
| Tokens + canonical registry     | M13       | Verified entries only; no address without a source                                          |
| Data + webhooks                 | M14       | Indexed adapter, signed/replayed delivery, SSRF-safe URLs                                   |
| Usage metering + credits        | M15       | Append-only ledger; no token dependency                                                     |
| SDKs + CLI                      | M16       | Browser/server split enforced by lint                                                       |
| Dashboard functionality         | M17       | Real project data; onboarding empty states                                                  |
| Docs guides + examples          | M18       | Per-module guides, CI-built examples                                                        |
| Security review + release gates | M19–M22   | §67 gates, production-readiness report                                                      |

**Blocked on owner input:** account-abstraction provider selection; production
provider credentials (RPC, bundler, paymaster, indexer, email); brand vector
assets (placeholder mark in use); deployment target.

---

## 4. Deployment posture

Three intents, and how the current state meets them.

### 4.1 Deploy in this state

The platform builds and runs as a production Next.js app. What ships is a
**pre-release marketing site + docs + a navigable app shell** — honest about what
works, with every unbuilt capability shown as a preview that returns
`HS_FEATURE_NOT_ENABLED` rather than a fake success.

To deploy you need only: a host that runs a Next.js 15 app (Node 20.11+), the
public env vars in `.env.example` (chain IDs, public URLs), and DNS
(`www.hoodstack.io`, with `hoodstack.io` → `www`). No database, no secrets, and
no provider accounts are required for this state, because nothing here reads
them yet.

### 4.2 Keep building, ship agile

The registry keeps every product route permanent, so new work **activates**
modules in place rather than reorganizing the site (ADR 0005/0006). Shipping a
capability = flip its availability to `enabled` after the activation checklist,
publish its API/SDK, add a changelog entry — the URL never moves. This lets us
deploy today and ship increments continuously without breaking links or mental
models.

### 4.3 No funds, secrets, or credentials in public

Interpreting "don't keep any funds/secrets in the public website or repo" as a
hard rule, enforced structurally:

- **No custody, ever.** HoodStack holds no private keys, mnemonics, or user
  funds, and has no code path that could (ADR 0003). Nothing to leak because
  nothing is held.
- **No secrets in the repo.** `.gitignore` excludes `.env`, `*.pem`, `*.key`,
  keystores, deployment/broadcast material, and data dumps. `.env.example` is
  placeholders only. CI runs a secret scan (gitleaks). Every commit is
  hand-scanned before push.
- **No secrets in the browser.** Lint boundaries prevent a browser-safe package
  from importing server/database packages; only `NEXT_PUBLIC_` values reach the
  client, and none of those are secret.
- **No secrets in git history / no personal identity.** Commits are authored as
  `HoodStack <…noreply…>`; pushes authenticate over a dedicated SSH key isolated
  from any personal login.
- **Provider credentials, when added, live in the host's environment only** —
  never committed, encrypted at rest in the app, redacted in every error/log.

> If "fuds" meant **FUD** (fear/uncertainty/doubt) rather than funds/secrets:
> the "pre-release / not audited / not launched" statements are deliberate and
> required for honesty and legal safety, not self-deprecation. They can be
> tightened in tone, but they should not be removed. Flag it and we'll adjust
> the wording.

---

## 5. Honest caveats

- **Not audited, pre-release.** Do not secure real funds with it. Mainnet writes
  are disabled by default.
- **The app shell has no backend.** It renders and navigates; there is no auth,
  database, or API behind it yet.
- **Brand mark is a placeholder** (layered squares, clearly not final). No
  third-party logo is used.
- **Provider-dependent features** (accounts, gas sponsorship, indexed data) will
  require configured third-party providers; HoodStack operates none of that
  infrastructure itself and does not claim to.

---

## 6. Verify locally

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm --filter @hoodstack/platform dev   # http://localhost:3000
```
