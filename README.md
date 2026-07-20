<!--
  Brand slot - replace with the approved HoodStack lockup once vector assets
  are supplied. See docs/brand/README.md. Do not substitute a generic icon.
  <p align="center"><img src="public/brand/lockup-horizontal.svg" alt="HoodStack" width="280"></p>
-->

# HoodStack

**Infrastructure built to scale.**

HoodStack is a Robinhood Chain-native developer infrastructure stack for
accounts, transaction orchestration, gas sponsorship, token utilities, chain
data, automation, and production application development.

[Website](https://www.hoodstack.io) · [X](https://x.com/hoodstack_) ·
[GitHub](https://github.com/hoodstack) ·
[Security](SECURITY.md) · [Plan](IMPLEMENTATION_PLAN.md)

> **HoodStack is an independent developer infrastructure project and is not
> affiliated with, endorsed by, sponsored by, or operated by Robinhood Markets,
> Inc. or its affiliates. Robinhood and Robinhood Chain are trademarks of their
> respective owners.**

---

## Release status

Pre-release. The table below is the authoritative record of what is implemented.
Everything else in this document describes intended architecture.

| Package                    | Status      | What works                                                                         |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `@hoodstack/errors`        | Implemented | `HS_*` error taxonomy, redaction, normalization, retry classification              |
| `@hoodstack/network`       | Implemented | Chain definitions, chain validation, explorer links, RPC health, endpoint fallback |
| `@hoodstack/config`        | Implemented | Typed module registry driving navigation, routing, and gating                      |
| `@hoodstack/design-tokens` | Implemented | Themed token system, dark + light, Tailwind preset                                 |
| `apps/platform`            | Partial     | Landing page, 15 product routes, app shell, preview system, CSP                    |
| API (`/v1`)                | Not started | -                                                                                  |
| Auth, dashboard, SDKs, CLI | Not started | -                                                                                  |

**106 tests passing.** Every module in the registry is `preview`; none is
`enabled`, because no backing implementation exists yet. The application shell
renders and navigates, but there is no authentication and no backend behind it.

**Not production-ready. Not audited. No token has launched and no token contract
has been deployed.** Do not use this to secure funds you cannot afford to lose.

---

## The stack

HoodStack is broader than wallet-as-a-service. Wallet infrastructure is one
layer.

**Identity** - authentication · embedded accounts · passkeys · recovery ·
identity linking · device and session management

**Execution** - transactions · batch execution · simulation · smart accounts ·
session keys · delegated execution · contract calls

**Gas** - sponsorship · paymaster policies · budgets · analytics · abuse controls

**Assets** - token utilities · canonical asset registry · stock-token metadata ·
balances and allowances · transfers and approvals · asset verification

**Connectivity** - chain data · webhooks · event streams · RPC routing ·
transaction history · indexed activity

**Automation** - agent accounts · agent policies · workflows · scheduled
execution · treasury automation · subscription permissions

**Security** - spending policies · contract and recipient allowlists · risk
checks · audit logs · security events · emergency controls

**Developer platform** - TypeScript, React, and server SDKs · CLI · REST API ·
playground · dashboard · examples · OpenAPI

**Network coordination** - usage credits · developer capacity · gas entitlements
· operator bonding · agent collateral · ecosystem incentives · governance ·
token utility

Every module has a permanent route from the first release. Implementation grows
behind stable interfaces - see
[ADR 0006](docs/adr/0006-progressive-module-activation.md).

---

## Quickstart

Requires Node 20.11+ and pnpm 10+.

```bash
git clone https://github.com/hoodstack/hoodstack.git
cd hoodstack
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

Run the platform application locally:

```bash
pnpm --filter @hoodstack/platform dev
# http://localhost:3000
```

Copy `.env.example` to `.env` for local configuration. `.env` is gitignored, and
`.env.example` contains placeholders only.

### Using the network package

```ts
import {
  robinhoodTestnet,
  assertChainMatches,
  assertWriteAllowed,
  getExplorerTxUrl,
} from "@hoodstack/network";

// Reject a wallet on the wrong network before anything is signed.
assertChainMatches(await wallet.getChainId(), robinhoodTestnet);

// Mainnet writes are closed by default; enabling them is an explicit act.
assertWriteAllowed(robinhoodTestnet, { allowMainnetWrites: false });

getExplorerTxUrl(robinhoodTestnet, txHash);
```

Chain definitions extend viem's `Chain`, so they pass directly to
`createPublicClient`, wagmi, or any viem-compatible tooling.

---

## Robinhood Chain support

| Network                 | Chain ID | Gas | Explorer                                                   |
| ----------------------- | -------- | --- | ---------------------------------------------------------- |
| Robinhood Chain         | 4663     | ETH | [Blockscout](https://robinhoodchain.blockscout.com)        |
| Robinhood Chain Testnet | 46630    | ETH | [Blockscout](https://explorer.testnet.chain.robinhood.com) |

Testnet is the default everywhere. Testnet ETH is available from the
[faucet](https://faucet.testnet.chain.robinhood.com).

Public RPC endpoints are rate-limited and shared. They are fine for local
development; in production HoodStack refuses to fall back to them rather than
degrade silently under load.

HoodStack does **not** operate RPC infrastructure, a bundler, paymaster
liquidity, an indexer, or MPC/HSM custody. Each is a third party behind an
adapter - see [ADR 0002](docs/adr/0002-account-abstraction-provider.md).

---

## Packages

| Package                                              | Description                          |
| ---------------------------------------------------- | ------------------------------------ |
| [`@hoodstack/errors`](packages/errors)               | Normalized error taxonomy            |
| [`@hoodstack/network`](packages/network)             | Chain definitions and RPC utilities  |
| [`@hoodstack/config`](packages/config)               | Typed module registry                |
| [`@hoodstack/design-tokens`](packages/design-tokens) | Color, type, spacing, motion tokens  |
| [`apps/platform`](apps/platform)                     | Marketing site and application shell |

Planned: `ui`, `accounts`, `auth`, `transactions`, `gas`, `tokens`, `data`,
`webhooks`, `usage`, `credits`, `sdk`, `server`, `react`, `cli`, `database`,
`logging`, `testing`.

Directories are created when their contents are actually built, rather than
committed empty.

---

## Documentation

- [Implementation plan](IMPLEMENTATION_PLAN.md) - milestones, open questions, risks
- [System overview](docs/architecture/system-overview.md) - layers, dependency graph, request path
- [Architecture decisions](docs/adr/) - ADRs 0001-0006
- [Threat model](docs/security/threat-model.md)
- [Key management](docs/security/key-management.md)
- [Incident response](docs/security/incident-response.md)
- [Responsible disclosure](docs/security/responsible-disclosure.md)
- [Module activation](docs/operations/module-activation.md)

---

## Roadmap

**Phase 1 (current)** - platform, dashboard, versioned API, testnet account
abstraction, transactions and simulation, gas policies, tokens, data, webhooks,
usage and credits, SDKs, CLI, documentation, examples. Completed before any
token launch.

**Phase 2** - token staking for developer capacity, gas entitlement adapter,
advanced session keys, programmable spending policies, team roles, agent
accounts and budgets, React Native SDK.

**Phase 3** - infrastructure operator network, bonded bundlers and paymasters,
simulation and security marketplaces, agent reputation, enterprise organizations,
compliance adapters.

**Phase 4** - decentralized execution marketplace, cross-chain accounts,
intent-based execution, governance activation, selective multi-chain expansion.

Robinhood Chain remains HoodStack's primary identity throughout.

---

## Security

Report vulnerabilities privately - see [SECURITY.md](SECURITY.md). Do not open a
public issue for a security problem.

HoodStack has not been audited and makes no claim to be bank-grade,
military-grade, unhackable, battle-tested, or institutional-grade.

Properties the codebase is built around: no key custody and no ability to move
user funds; tenant isolation; no server secret reachable from a browser bundle;
chain ID validated before signing and before submission; non-idempotent
operations never retried automatically; fail-closed gating; errors that never
carry stack traces, SQL, credentials, or tenant data across a trust boundary.

---

## Contributing

Contribution guidelines are being written alongside M3. Until then, open an
issue before starting substantial work.

---

## Legal

HoodStack is an independent project, not affiliated with Robinhood Markets, Inc.

- HoodStack does not provide brokerage services.
- HoodStack does not provide investment advice.
- Asset availability may depend on jurisdiction.
- Developers remain responsible for their own legal and compliance obligations.
- Token utility documentation is technical architecture, not an offer.
- The HoodStack token has not launched. Any claim otherwise is not from us.

## License

[Apache-2.0](LICENSE)
