# ADR 0005: A single permanent module registry

- **Status:** Accepted
- **Date:** 2026-07-19
- **Implemented in:** `packages/config`

## Context

HoodStack presents a large product surface - roughly thirty module routes across
a marketing site and an authenticated application - built progressively over
four phases.

The naive approach is to add navigation entries, routes, and product pages as
each feature ships. That produces a site whose structure changes with every
release: URLs move, categories get renamed, navigation is reorganized, and
developers' mental models are invalidated repeatedly.

## Decision

**One typed registry is the single source of truth for every module surface.**

`@hoodstack/config` exports a `ModuleDefinition` per module, and the following
all derive from it: app sidebar, public product navigation, route definitions,
documentation links, availability gating, and preview behaviour.

```ts
interface ModuleDefinition {
  id: HoodStackModuleId;
  name: string;
  shortDescription: string;
  description: string;
  category: HoodStackModuleCategory;
  publicHref?: string;
  appHref: (projectId: string) => string;
  docsHref: string;
  icon: HoodStackIconName;
  availability: ModuleAvailability;
  featureFlag?: string;
  requiredPlan?: string;
  relatedModules?: readonly HoodStackModuleId[];
}
```

Every module appears in navigation from the first release, regardless of
implementation state. Routes are permanent. Implementation grows behind stable
interfaces.

## Rationale

**Structural stability is a feature.** A developer who bookmarks
`/app/proj_x/gas` should find gas there in a year. Reorganizing navigation to
reflect internal delivery sequencing exports our project management onto users.

**Derived navigation cannot drift.** Sidebar, product pages, and docs links come
from one place, so they cannot disagree. Adding a module is one registry entry.

**The types catch what review misses.** A closed `HoodStackModuleId` union means
a typo in a route reference fails compilation. Registry integrity - unique
routes, valid cross-references, correct prefixes - is enforced by tests, which
catch the errors that grow naturally in a thirty-entry table.

**Availability is behaviour, not decoration.** `availability` controls route
rendering, control interactivity, and API access. It is explicitly _not_ a
marketing badge: the specification prohibits plastering status tags across the
site, and rendering it as one would produce exactly that.

**One gate for honesty.** Because availability lives in one field in one file,
"is this module actually available?" has one answer, and claiming availability
requires a deliberate edit with a checklist attached rather than the incidental
existence of a route.

## Consequences

- Module IDs and routes are a public commitment. Renaming one is a breaking
  change requiring redirects.
- Every registry entry needs real product copy, including unimplemented modules -
  which is the point: a preview route must explain the module honestly, not say
  "coming soon".
- Modules that are not yet implemented cannot be hidden by deletion. They are
  visible and honest, or they are not in the registry at all.
- Project IDs are URL-encoded into routes, tested, since they arrive from
  untrusted input.

## Verified by tests

`packages/config/src/registry.test.ts` asserts: entries are keyed by their own
ID; app and public routes are unique; route prefixes are correct; related
modules exist and are not self-references; every module belongs to a rendered
category and appears in navigation exactly once; project IDs are encoded; lookup
does not resolve inherited object properties; and no module claims to be enabled
while its implementation does not exist.
