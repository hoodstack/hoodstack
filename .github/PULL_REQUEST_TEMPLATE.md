## What and why

<!-- What changed, and what problem it solves. Link the issue. -->

## Verification

<!--
How you confirmed this works. "Tests pass" is not sufficient if the change has a
runtime surface you could have exercised.
-->

- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` pass
- [ ] Exercised the affected behaviour, not only the test suite

## Security checklist

Delete any line that is genuinely not applicable - do not tick it blindly.

- [ ] No key material, credential, or secret is stored or logged
- [ ] No server secret is reachable from a browser bundle (no `NEXT_PUBLIC_` secret)
- [ ] Queries are tenant-scoped; no cross-tenant access is possible
- [ ] Chain ID is validated before signing and before submission
- [ ] Mainnet writes remain gated behind explicit opt-in
- [ ] No non-idempotent operation is retried automatically
- [ ] New states fail closed
- [ ] Errors carry no stack trace, SQL, credential, or tenant data

## Honesty checklist

- [ ] No mocked success response from a production-facing route
- [ ] No fabricated metrics, activity, charts, or history
- [ ] No module marked `enabled` without completing the
      [activation checklist](../docs/operations/module-activation.md)
- [ ] No unverifiable security or capability claim added to docs or UI

## Changeset

- [ ] `pnpm changeset` run, or this change does not affect a published package
