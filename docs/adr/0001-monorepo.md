# ADR 0001: TypeScript monorepo with a modular monolith

- **Status:** Accepted
- **Date:** 2026-07-19

## Context

HoodStack ships several artifacts that must stay version-compatible: a platform
web application, an HTTP API, a background worker, and roughly a dozen published
`@hoodstack/*` packages consumed by third-party developers.

Two structural questions: one repository or several, and one deployable service
or many.

## Decision

**One repository.** pnpm workspaces with Turborepo for task orchestration and
caching. TypeScript in strict mode, with `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes` enabled.

**A modular monolith, not microservices.** The API is one deployable with clear
internal module boundaries. The worker is separate because its scaling and
failure characteristics genuinely differ - a slow webhook retry must not occupy
an API request handler.

## Rationale

A published SDK, the API it calls, and the types they share must agree. Split
across repositories, that agreement is maintained by version bumps and hope; in
one repository it is maintained by the type checker. A breaking change to an API
contract fails CI in the same commit that introduces it.

Microservices would be premature. Their benefit - independent scaling and
deployment - is real at organizational scale we do not have, and their cost is
immediate: network calls where function calls would do, distributed transactions,
partial-failure handling, and a much harder local development story. Reliability
is a stated priority, and a monolith has strictly fewer ways to fail.

Module boundaries are still enforced, through package structure. Extracting a
service later is then a deployment change, not a rewrite.

Strict TypeScript settings are non-negotiable in a codebase constructing
financial transactions. `noUncheckedIndexedAccess` in particular catches an
entire class of undefined-access bug that is easy to write and expensive to hit
at runtime.

## Consequences

**Accepted:**

- Full-workspace CI runs are slower than a single service's; mitigated by
  Turborepo caching and task filtering.
- Repository-wide changes are possible, so review discipline matters more.
- `exactOptionalPropertyTypes` requires care around optional fields. This has
  already caught real bugs during initial development.

**Gained:**

- Atomic cross-package changes with type-level verification.
- One toolchain, one lint configuration, one test runner.
- Local development that runs everything.

## Alternatives considered

**Polyrepo.** Rejected: version skew between SDK and API is the dominant risk,
and polyrepo makes it structural.

**Microservices from the start.** Rejected: cost now, benefit later, and the
benefit is one we can obtain later by extraction.

**Nx instead of Turborepo.** Both viable. Turborepo chosen for a smaller
configuration surface; the decision is cheap to revisit since it affects task
running, not source layout.
