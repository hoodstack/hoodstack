# Contributing to HoodStack

Thanks for your interest. HoodStack is early - see the
[implementation plan](IMPLEMENTATION_PLAN.md) for where things stand.

## Before you start

**Open an issue first** for anything substantial. The architecture is
constrained by decisions recorded in [ADRs](docs/adr/), and a change that
conflicts with one needs an ADR discussion before code.

Small fixes - typos, broken links, obvious bugs - go straight to a PR.

## Development

Requires Node 20.11+ and pnpm 10+.

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
pnpm format
```

Everything must pass before a PR is ready. CI runs the same commands.

## Non-negotiables

These are enforced in code and review. A PR violating one will not merge
regardless of how good the rest of it is.

**Never fabricate.** No mocked success responses from production-facing routes.
No invented metrics, charts, activity, or histories. No claiming a feature works
because a route exists. If it is not implemented, say so.

**Never claim unverified security properties.** Not "audited", "bank-grade",
"military-grade", "unhackable", "battle-tested", or "institutional-grade" -
unless there is evidence, linked.

**Never store key material.** No private keys, mnemonics, seed phrases, or
signing secrets, in any form. A PR that introduces key storage requires a
superseding ADR (see [ADR 0003](docs/adr/0003-key-management-boundary.md)).

**Never expose server secrets to a browser.** No secret behind a `NEXT_PUBLIC_`
prefix. The lint boundary rules catch the common cases; they are not a substitute
for thinking about it.

**Testnet by default.** Mainnet writes require explicit opt-in. Never add a code
path that defaults to mainnet.

**Validate chain ID before signing and before submission.** A wallet can switch
networks between those two points.

**Never retry non-idempotent operations.** A transaction broadcast that timed out
may already have landed.

**Fail closed.** A missing flag, absent config, or unrecognized state disables
functionality. It never enables it.

## Tests

New behaviour needs tests. Prioritize:

- tenant isolation - a regression here is silent and severe
- chain validation and mismatch handling
- retry and idempotency behaviour
- webhook signature verification and replay rejection
- redaction - that secrets do not reach errors or logs
- gas policy enforcement
- credit ledger arithmetic

Test the security property, not just the happy path. A test asserting that
something is _refused_ is usually more valuable than one asserting it works.

## Commits and PRs

[Conventional commits](https://www.conventionalcommits.org/): `feat:`, `fix:`,
`docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `build:`, `ci:`.

Use `pnpm changeset` for any change affecting a published package.

In your PR, describe what changed and why, note anything security-relevant, and
say what you did to verify it. "Tests pass" is not verification if the change has
a runtime surface you could have exercised.

## Activating a module

Moving a module from `preview` to `enabled` follows
[the activation checklist](docs/operations/module-activation.md). It is not a
one-line change.

## Security

Do not open a public issue for a vulnerability. See [SECURITY.md](SECURITY.md).

## Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

Contributions are licensed under [Apache-2.0](LICENSE).
