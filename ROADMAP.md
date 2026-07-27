# HoodStack: product overview

What HoodStack is and what you can build with it today. Module facts come from
the registry in `packages/config`; the [ADRs](docs/adr) record the architecture.

**Updated:** 2026-07-27

---

## What HoodStack is

HoodStack is the developer infrastructure stack for **Robinhood Chain**: the layer
an application builds on so it never re-implements accounts, execution, gas,
assets, data, automation, security, or developer tooling.

It is delivered as one platform:

- a **dashboard** with a live console for every module,
- a **REST API** (`/api/v1`, authenticated by project API key, rate limited, and
  metered),
- a typed **SDK** and a **CLI**, and
- **docs**, an interactive playground, and recipes.

Principles that do not change:

- **Non-custodial.** HoodStack cannot move user funds.
- **Honest surfaces.** A module is shown as available only when it truly works.
- **Permanent addressing.** Every module's route and API path are fixed from the
  first release, so links made today keep working.
- **One spine.** Every API call is authenticated, rate limited, and metered
  through the same gateway.

## The stack: eight products

| Product | What it gives a builder |
| --- | --- |
| Identity | Accounts, authentication, and sessions for end users |
| Execution | Build, simulate, submit, and govern transactions |
| Assets | Tokens and a verified asset registry |
| Connectivity | Chain data, explorer, webhooks, keys, environments |
| Automation | Agent accounts, treasury moves, scheduled workflows |
| Security | Risk controls and an audit trail |
| Developer platform | SDK, CLI, API reference, playground, recipes |
| Network coordination | Usage metering, credits, token utility |

---

## Available now

Working today, each with a dashboard surface and, where it applies, a public API.

| Product | Modules |
| --- | --- |
| Overview | Home, Projects, Activity |
| Identity | Accounts (registry with live on-chain state) |
| Execution | Transactions (simulate and track), Gas (live tracker), Policies |
| Assets | Tokens (ERC-20 reads), Asset Registry |
| Connectivity | Data, Explorer, Webhooks, API Keys, Environments |
| Security | Security posture, Audit Logs |
| Developer platform | API Reference, Playground, SDK, CLI, Recipes |
| Network coordination | Usage, Credits, Token Utility |
| Settings | Project Settings |

The full read, simulate, configure, verify, and audit surface is live.

## Expanding continuously

HoodStack ships modules regularly. Coming next across the stack: end-user
authentication and session permissions, signed and sponsored execution, agent
and treasury automation, and the network-coordination layer. Each lands the same
way the modules above did, honestly, and only when it truly works.

Follow the [changelog](https://www.hoodstack.io/changelog) for releases.
