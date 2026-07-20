# Changelog

Notable changes to HoodStack. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project follows
[Semantic Versioning](https://semver.org/).

Module activations are recorded here - see
[module activation](docs/operations/module-activation.md).

## [Unreleased]

Pre-release. Nothing has been published to npm.

### Added

- `@hoodstack/errors` - normalized error taxonomy. Stable `HS_*` codes with
  category, HTTP status, retryable flag, request ID, and documentation URL.
  Details redacted at construction. Symbol-branded identification that survives
  duplicate module copies. Wire round-trip via `toJSON`/`fromJSON`.
- `@hoodstack/network` - Robinhood Chain mainnet (4663) and testnet (46630)
  definitions extending viem's `Chain`. Chain-ID validation, mainnet write gate,
  explorer and faucet helpers, native currency formatting, JSON-RPC client with
  timeout and safelisted retry, endpoint fallback for reads, RPC health probes,
  production endpoint resolution.
- `@hoodstack/config` - typed module registry covering 29 modules across 8
  categories. Drives app navigation, public product routes, documentation links,
  and fail-closed availability gating.
- Monorepo tooling: pnpm workspaces, Turborepo, strict TypeScript, Prettier,
  ESLint with browser/server import boundaries, GitHub Actions CI with lockfile
  verification, dependency audit, and secret scanning.
- Documentation: implementation plan, system overview, ADRs 0001-0006, threat
  model, key management, incident response, responsible disclosure, module
  activation runbook.

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

- No module is marked `enabled`. The platform application and API do not exist
  yet, so no capability is claimed as available.
- No token has been launched. No token contract has been deployed.
- No security audit has been performed.
