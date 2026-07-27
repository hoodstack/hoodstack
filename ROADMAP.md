# HoodStack: product and module roadmap

What HoodStack is, every module it comprises, and the status of each. This is the
product-level companion to [PROJECT_STATUS.md](PROJECT_STATUS.md) (engineering
snapshot) and the [ADRs](docs/adr). Module facts come from the registry in
`packages/config`, the single source of truth.

**Updated:** 2026-07-27 (20 modules shipped)

---

## 1. The product

HoodStack is the developer infrastructure stack for **Robinhood Chain**: the
layer an application builds on so it never re-implements accounts, execution,
gas, assets, data, automation, security, or developer tooling.

It is delivered as one platform with four surfaces:

- a **dashboard** (projects, keys, and a live console for every module),
- a **REST API** (`/api/v1`, authenticated by project API key, rate limited, and
  metered),
- **SDKs and a CLI** (forthcoming), and
- **docs** and an interactive playground.

Principles that do not change:

- **Non-custodial.** HoodStack cannot move user funds. Accounts are standard,
  audited smart contracts owned by a key the user can export.
- **Honest surfaces.** A module is `enabled` only when it truly works. Preview
  modules describe intent and never fabricate data.
- **Permanent addressing.** Every module's route and API path are fixed from the
  first release, so links made today keep working.
- **One spine.** Every API call is authenticated, rate limited, and metered
  through the same gateway; every module records to the same usage ledger.

The full stack is eight products, made of 32 modules:

| Product | What it gives a builder |
| --- | --- |
| Identity | Accounts, authentication, and sessions for end users |
| Execution | Build, simulate, submit, and govern transactions |
| Assets | Tokens and a verified asset registry |
| Connectivity | Chain data, explorer, webhooks, keys, environments |
| Automation | Agent accounts, treasury moves, scheduled workflows |
| Security | Risk controls and an audit trail |
| Developer platform | SDKs, CLI, API reference, playground, recipes |
| Network coordination | Usage metering, credits, token utility |

---

## 2. Status legend

| Mark | Meaning |
| --- | --- |
| ✅ **Shipped** | Enabled and working, with a dashboard surface and, where it applies, a public API. |
| 🔨 **Next up** | Buildable now on the existing foundation. No external blocker. |
| 🧊 **Backlog** | Blocked on a dependency named in the row (account abstraction, payments, a scheduler, or the token). |

The blocker for most of the backlog is one decision: the **account-abstraction
provider** (see §5 and [ADR 0002](docs/adr/0002-account-abstraction-provider.md)).

---

## 3. Modules by product

### Overview (dashboard shell)

| Module | Status | Ships / blocker |
| --- | --- | --- |
| Home | ✅ Shipped | Live project overview: network status, key and usage counts, quickstart. |
| Projects | ✅ Shipped | Create and open projects; org provisioned on first sign-in. |
| Activity | ✅ Shipped | Chronological feed from the real usage ledger. |

### Identity

| Module | Status | Ships / blocker |
| --- | --- | --- |
| Accounts | ✅ Shipped | Account registry with live on-chain enrichment (balance, nonce, type). |
| Authentication | 🧊 Backlog | End-user sign-in (passkeys/email/wallet). Needs the end-user SDK and AA. |
| Sessions | 🧊 Backlog | Scoped, expiring permissions. Needs AA session keys (Kernel). |

### Execution

| Module | Status | Ships / blocker |
| --- | --- | --- |
| Transactions | ✅ Shipped | Simulate (eth_call + gas, policy-checked) and track by hash. Signed submit needs AA. |
| Gas | ✅ Shipped | Live gas tracker. Sponsorship (paymaster) needs AA. |
| Policies | ✅ Shipped | Spending ceiling + recipient allowlist, evaluated against simulations. |

### Assets

| Module | Status | Ships / blocker |
| --- | --- | --- |
| Tokens | ✅ Shipped | ERC-20 metadata and holder-balance reads. Transfers need AA. |
| Asset Registry | ✅ Shipped | Verified entries keyed by chain + address, metadata read from chain. |

### Connectivity

| Module | Status | Ships / blocker |
| --- | --- | --- |
| Data | ✅ Shipped | Account, transaction, and block reads (dashboard + API). |
| Explorer | ✅ Shipped | Universal search over accounts, transactions, and blocks. |
| Webhooks | ✅ Shipped | Signed endpoints + test delivery. Automatic delivery needs a worker. |
| API Keys | ✅ Shipped | Mint, reveal-once, and revoke keys per project and environment. |
| Environments | ✅ Shipped | Testnet/mainnet reference: chain, RPC, explorer, faucet. |

### Automation

| Module | Status | Ships / blocker |
| --- | --- | --- |
| Agents | 🧊 Backlog | Programmable accounts for software. Needs AA + session keys. |
| Treasury | 🧊 Backlog | Programmatic fund movement. Needs AA + signed execution. |
| Workflows | 🧊 Backlog | Scheduled/event-triggered execution. Needs a scheduler + AA. |

### Security

| Module | Status | Ships / blocker |
| --- | --- | --- |
| Security | ✅ Shipped | Posture view over policies, allowlists, keys, and webhooks. Enforcement-at-submit needs AA. |
| Audit Logs | ✅ Shipped | Append-only record of privileged actions (keys, policies, webhooks, assets, accounts, projects). |

### Developer platform

| Module | Status | Ships / blocker |
| --- | --- | --- |
| API Reference | ✅ Shipped | Documented reference for the live `/api/v1` endpoints. |
| Playground | ✅ Shipped | Run the live read endpoints against testnet/mainnet from the dashboard. |
| SDKs | 🔨 Next up (larger) | A typed TS client over the live API. Buildable now; a separate package effort. |
| CLI | 🔨 Next up (larger) | Project setup, keys, diagnostics. Buildable now; a separate package effort. |
| Recipes | 🔨 Next up | Working end-to-end examples over the shipped API. Content-led. |

### Network coordination

| Module | Status | Ships / blocker |
| --- | --- | --- |
| Usage | ✅ Shipped | Metered consumption, totals and breakdowns from the ledger. |
| Credits | 🧊 Backlog | Non-transferable capacity ledger. Needs a billing/allocation model. |
| Token Utility | 🧊 Backlog | How a future token funds capacity. Needs the token (not launched). |

### Settings

| Module | Status | Ships / blocker |
| --- | --- | --- |
| Project Settings | ✅ Shipped | Rename and delete a project (with a typed confirmation). |
| Team | 🧊 Backlog | Members and roles. Needs an invitation flow. |
| Billing | 🧊 Backlog | Plan, invoices, payment method. Needs a payments provider (e.g. Stripe). |

---

## 4. Rollup

- **Shipped (20):** Home, Projects, Activity, Accounts, Transactions, Gas,
  Policies, Tokens, Asset Registry, Data, Explorer, Webhooks, API Keys,
  Environments, Security, Audit Logs, API Reference, Playground, Usage,
  Project Settings.
- **Next up, no blocker:** the larger SDK / CLI / Recipes efforts.
- **Backlog, blocked:** Authentication, Sessions, Agents, Treasury, Workflows
  (account abstraction); Credits, Team, Billing (billing/invites); Token Utility
  (token launch).

The entire **read / simulate / configure / verify** surface is real. The backlog
is dominated by the **write path**, which one decision unblocks.

---

## 5. Backlog: the decision that unblocks the write path

Authentication, Sessions, signed Transactions, Gas sponsorship, Agents, Treasury,
and Workflows all wait on the same thing: the **account-abstraction provider**.
The full evaluation and recommendation is in
[ADR 0002](docs/adr/0002-account-abstraction-provider.md). Grounded in live reads,
Robinhood Chain already has the ERC-4337 EntryPoint and the Kernel, Safe, and
SimpleAccount factories deployed on both networks, so only a bundler and a
paymaster remain.

> **Your call to make:** approve **Kernel + Pimlico** (with the self-host
> fallback)? If yes, the first step is the spike, one sponsored UserOperation on
> testnet behind a feature flag, which is the concrete proof before any real
> module work or spend. That single confirmed UserOp validates EntryPoint +
> Kernel + bundler + paymaster, and then Accounts, Transactions, Gas, and Sessions
> wire up in order.

Other backlog dependencies, tracked separately:

- **Credits / Billing:** a payments provider and an allocation model.
- **Team:** an invitation flow (email + Privy linking).
- **Token Utility:** the token launch, which is deliberately downstream of a
  stable Phase 1 (see [ADR 0004](docs/adr/0004-token-utility-separation.md)).
- **Workflows:** a scheduler, in addition to AA.
- **Webhooks automatic delivery:** a background delivery worker with retries.
