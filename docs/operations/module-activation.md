# Module activation

A module in `@hoodstack/config` moves from `preview` to `enabled` exactly once,
deliberately. This document is the checklist that gates that change.

The registry entry is the switch. Nothing else - not the existence of a route,
a page, a designed interface, or an SDK type - makes a module available.

## Why the gate exists

A route that renders, a control that is visible, and an SDK method that has a
type signature are all cheap. None of them means the module works. Treating any
of them as evidence of availability is how a product ends up claiming
capabilities it does not have.

So availability is one field, in one file, changed by one deliberate edit, with
this checklist attached.

## Checklist

A module may be marked `enabled` only when all of the following are true.

1. **API routes ship.** The versioned endpoints backing the module are
   implemented, validated with Zod, tenant-scoped, and rate-limited.
2. **No mocked responses.** No path in the module returns a fabricated success.
   Unimplemented branches return a real error, not a placeholder.
3. **SDK methods ship.** Published in the browser, server, or React package as
   appropriate, with the browser/server boundary respected - no server secret is
   reachable from a client bundle.
4. **Tests pass.** Unit tests for the logic, integration tests against the API,
   and tenant-isolation tests proving one project cannot read another's data.
5. **Chain validation.** Any path that signs or submits validates the active
   chain ID immediately before signing and again before submission.
6. **Mainnet posture.** Writes are gated behind the project's explicit
   mainnet-write opt-in. Testnet is the default.
7. **Documentation is tested.** Every code sample in the module's docs has been
   run against a real environment and works as written.
8. **A working example exists.** At minimum a runnable snippet; ideally an entry
   in `examples/`.
9. **Observability.** Structured logs, metrics, and alerting cover the module's
   failure modes.
10. **Errors are normalized.** Provider failures are mapped to
    `@hoodstack/errors` codes; no upstream error shape leaks to callers.
11. **Changelog entry.** The activation is recorded publicly.

## What must not change on activation

Activation deepens a module. It does not move it.

- The public route stays the same.
- The app route stays the same.
- The sidebar position stays the same.
- The module ID stays the same.

Developers bookmark these URLs and build mental models around this structure.
Renaming a module after launch to reflect an internal reorganization is a cost
paid entirely by users.

## Reverting

If an enabled module has to be pulled, set `availability` back to `preview` and
keep the route. The page then explains the current state honestly. Deleting the
route is worse than an honest preview: it breaks every existing link.
