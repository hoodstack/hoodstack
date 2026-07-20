# ADR 0006: Progressive module activation

- **Status:** Accepted
- **Date:** 2026-07-19
- **Related:** ADR 0005

## Context

ADR 0005 makes every module permanently visible. That raises an obvious
question: how does an unimplemented module behave without misleading anyone?

The two common answers are both bad. Hiding unbuilt modules contradicts ADR 0005
and breaks links when they appear. Showing them with mock data - fake balances,
fake charts, buttons that report success - is a lie that developers discover
only after building against it.

## Decision

**A module's route is always useful, and its controls never pretend.**

Three states, one field:

| State     | Route renders                                                   | Controls                       | API                      |
| --------- | --------------------------------------------------------------- | ------------------------------ | ------------------------ |
| `enabled` | Real interface                                                  | Interactive                    | Real responses           |
| `preview` | Specification, architecture, intended API, docs, access request | Visibly disabled with a reason | `HS_FEATURE_NOT_ENABLED` |
| `private` | Access-gated                                                    | Gated                          | Gated                    |

Rules that follow:

1. **No mocked success.** A production-facing route never returns a fabricated
   success. Unimplemented paths return `HS_FEATURE_NOT_ENABLED`.
2. **No fabricated data.** No invented metrics, charts, activity, or histories.
   An empty project shows an onboarding state, not sample data.
3. **No silent failure.** An unavailable control is disabled and explains why,
   with a documentation link. It is never a button that quietly does nothing.
4. **No badge spam.** Availability is not rendered as a status tag on every card.
   Clarification appears where it genuinely helps - "Developer preview",
   "Request access" - not as decoration.
5. **Existence proves nothing.** A route, an interface, or a published type does
   not make a feature available. Only the registry does.

Activation follows the checklist in
[`docs/operations/module-activation.md`](../operations/module-activation.md):
API routes, no mocks, SDK methods, tests including tenant isolation, chain
validation, mainnet gating, tested docs, a working example, observability,
normalized errors, and a changelog entry. The URL and sidebar position never
change on activation.

## Rationale

**A preview route has genuine value.** Product specification, architecture,
intended API shape, and security constraints let a developer evaluate whether
HoodStack will fit before it is finished, and give us design feedback while it
is still cheap to act on. That is worth more than a hidden route or a "coming
soon" placeholder.

**Mock data is the expensive lie.** It survives review because it looks
finished, and it is discovered at integration time, after someone has committed
to the platform. The cost lands entirely on the user, and it destroys trust in
everything else we claim.

**Fail-closed gating.** `isModuleEnabled` requires both `enabled` availability
and, where declared, a live feature flag. A missing flag configuration disables
the module. A deployment mistake must never silently enable an unfinished
capability.

**Reversibility.** If an enabled module must be pulled, it reverts to `preview`
and keeps its route. An honest preview page is strictly better than a 404.

## Consequences

- Preview routes require real writing. This is a genuine cost and it is
  deliberate: the alternative is a page that says nothing or lies.
- Marketing may describe the platform architecture, but may not claim a module
  works. The registry is the arbiter.
- Every module currently sits at `preview`, because the platform application and
  API do not exist yet. Marking anything otherwise today would be false.
