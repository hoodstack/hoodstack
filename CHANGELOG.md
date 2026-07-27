# Changelog

Notable changes to HoodStack. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project follows
[Semantic Versioning](https://semver.org/).

Module activations are recorded here - see
[module activation](docs/operations/module-activation.md).

## [Unreleased]

### In development

- The account-abstraction write path: authentication, sessions, sponsored gas,
  agents, treasury, and workflows. These modules ship a preview until it lands.

## [0.1.0] - 2026-07-27

First public packages on npm and the early-access platform.

### Added

- Published to npm: `@hoodstack/errors`, `@hoodstack/network`,
  `@hoodstack/sdk`, and `@hoodstack/cli`.
- `@hoodstack/errors` - normalized error taxonomy. Stable `HS_*` codes with
  category, HTTP status, retryable flag, request ID, and documentation URL.
  Details redacted at construction. Symbol-branded identification that survives
  duplicate module copies. Wire round-trip via `toJSON`/`fromJSON`.
- `@hoodstack/network` - Robinhood Chain mainnet (4663) and testnet (46630)
  definitions extending viem's `Chain`. Chain-ID validation, mainnet write gate,
  explorer and faucet helpers, native currency formatting, JSON-RPC client with
  timeout and safelisted retry, endpoint fallback for reads, RPC health probes,
  production endpoint resolution.
- `@hoodstack/sdk` - typed TypeScript client over the live REST API: health,
  gas, RPC, account, transaction, block, and token reads, and transaction
  simulation. Throws `HoodStackError`.
- `@hoodstack/cli` - the `hoodstack` terminal client over the same API.
- `@hoodstack/config` (internal) - typed module registry covering 32 modules
  across 8 categories, 25 enabled. Drives app navigation, public product routes,
  documentation links, and fail-closed availability gating.
- `@hoodstack/design-tokens` (internal) - themed token system with dark and
  light modes and self-hosted typography.
- Platform: 25 live modules with a dashboard console and, where it applies, a
  REST endpoint under `/api/v1`, authenticated by project API key, rate limited,
  and metered through one gateway. Global network switch (testnet/mainnet),
  interactive playground, API reference, and code recipes over the live API.
- Monorepo tooling: pnpm workspaces, Turborepo, strict TypeScript, Prettier,
  ESLint with browser/server import boundaries, GitHub Actions CI with lockfile
  verification, dependency audit, and secret scanning.

### Security

- Non-idempotent JSON-RPC methods are never retried, and never failed over
  across endpoints. A broadcast can time out after acceptance; a retry could
  submit the same transaction twice.
- JSON-RPC application errors are not retried. Only genuinely transient codes
  (`-32005`, `-32603`) are.
- RPC endpoint URLs are redacted in every error, log, and health report, since
  providers routinely embed API keys in them.
- Mainnet writes are disabled by default and require explicit opt-in.
- Public RPC endpoints are refused as a production default rather than silently
  used.
- Errors never serialize stack traces or causes across a trust boundary.

### Notes

- Signed execution and automation are in development, blocked on the
  account-abstraction write path.
- The HSTACK token is live on Robinhood Chain (4663); usage credits remain the
  unit of capacity and the platform is fully usable without it.
- No security audit has been performed; keep production-critical flows on
  testnet.
