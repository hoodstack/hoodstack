# ADR 0007: Products as a layer above modules and packages

- **Status:** Accepted
- **Date:** 2026-07-19
- **Supersedes part of:** ADR 0005 (module categories)
- **Implemented in:** `packages/config/src/products.ts`

## Context

The registry originally grouped modules into build/connect/automate/protect
categories. Those names describe _what the engineering team does to a module_,
not what a developer is trying to accomplish.

The result was a platform that presented itself as a collection of packages.
Navigation read like a build manifest: accurate, and meaningless to someone
deciding whether HoodStack solves their problem. Nobody adopts a package. They
adopt a capability, and discover the packages afterwards.

## Decision

Three layers, explicit and separate.

```
Platform
   └── Product        what a developer adopts        (8 of them)
         └── Module   a surface within a product     (32 of them)
               └── Package   how it is built and shipped
```

Eight products: **Identity, Execution, Assets, Connectivity, Automation,
Security, Developer platform, Network.**

A `ProductDefinition` declares its modules and its **surfaces** - the ways it is
consumed (server SDK, React, REST, CLI, webhooks, dashboard, playground).
Surfaces are how the product layer stays concrete without leaking package names:
"Identity is available through the server SDK, React, REST, the CLI, and the
dashboard" is a product statement. "Identity is `@hoodstack/accounts` plus
`@hoodstack/auth`" is a build statement.

A module's `category` _is_ its product membership. There is no second source of
truth to drift.

## Rationale

**Products are the unit of adoption.** A developer thinks "I need gas
sponsorship," not "I need `@hoodstack/gas` and the paymaster adapter." The
navigation should answer the question they arrived with.

**Packages change; products should not.** Splitting `@hoodstack/accounts` into
two packages, or merging two, is an implementation decision. If the product
surface is defined in terms of packages, that refactor becomes a public
renaming. With this layer it is invisible.

**One product, several surfaces, is the actual shape of the thing.** Identity
genuinely is delivered as an SDK, hooks, a REST resource, and CLI commands.
Modeling that explicitly means marketing and the app can both describe it
without either inventing its own vocabulary.

**Module routes survive.** ADR 0005's commitment holds: every module keeps its
permanent URL. Products add hub routes above them, they do not move anything.

## Consequences

- Product hubs live at `/products/<product>`, module pages at
  `/products/<module>`, resolved by one dynamic route with products taking
  precedence.
- The two namespaces must never collide. A registry test enforces this - it
  caught a real collision immediately, between the Security product and the
  Security module.
- Where a module shares its product's name, the product hub _is_ its marketing
  page and the module carries no `publicHref`. Two pages competing for one URL
  and one search intent helps nobody.
- Sidebar sections are now products, so the application and the marketing site
  present the same eight names in the same order.
- `getAllPublicProductRoutes()` is the correct way to validate route coverage;
  neither the product list nor the module list is complete alone.

## Products added under this model

Three products the previous structure had no natural place for:

- **Asset Registry** - verified contracts and assets with recorded provenance.
  Directly mitigates the malicious-token-metadata and address-poisoning threats
  in the threat model, which makes it infrastructure rather than a nice-to-have.
- **Explorer** - a view of chain state that understands smart accounts, user
  operations, and sponsorship decisions. Deliberately scoped to _complement_
  Blockscout, not replace it; canonical block and transaction links continue to
  point there.
- **Recipes** - complete, runnable, CI-tested applications for the workflows
  people actually build. A recipe is a working application, never a fragment
  with the error handling omitted.

## Alternatives considered

**Keep verb-based categories (build/connect/automate/protect).** Rejected: they
describe our process, not the user's goal, and they have no natural home for
cross-cutting products like the registry.

**Flatten products away and list all 32 modules.** Rejected: a 32-item list has
no shape. The grouping is what makes the platform comprehensible.

**Make products the only layer and drop modules.** Rejected: modules are what
documentation, feature flags, and dashboard routes attach to. Collapsing them
would mean eight enormous pages and no way to gate a capability independently.
