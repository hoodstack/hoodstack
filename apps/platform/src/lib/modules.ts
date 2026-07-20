import { MODULE_LIST, type ModuleDefinition } from "@hoodstack/config";

/**
 * Resolves a URL segment back to its module.
 *
 * The registry owns routes as `appHref(projectId)` functions, so the segment is
 * derived from that rather than duplicated here. Duplicating it would let the
 * sidebar and the page it links to disagree - exactly what the single registry
 * exists to prevent.
 */
const SENTINEL = "__projectId__";

const BY_SEGMENT: ReadonlyMap<string, ModuleDefinition> = new Map(
  MODULE_LIST.flatMap((module) => {
    const href = module.appHref(SENTINEL);
    // Only project-scoped routes have a resolvable segment; organization-level
    // routes such as /app/projects are handled by their own static route.
    if (!href.startsWith(`/app/${SENTINEL}/`)) return [];
    const segment = href.slice(`/app/${SENTINEL}/`.length);
    return [[segment, module] as const];
  }),
);

export function moduleForSegment(segment: string): ModuleDefinition | undefined {
  return BY_SEGMENT.get(segment);
}

export function projectScopedSegments(): string[] {
  return [...BY_SEGMENT.keys()];
}
