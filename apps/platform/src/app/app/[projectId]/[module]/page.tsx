import { getRelatedModules, isModuleEnabled } from "@hoodstack/config";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ButtonLink,
  DefinitionRow,
  DisabledControl,
  Panel,
  StatusBadge,
} from "@/components/ui";
import { moduleForSegment } from "@/lib/modules";

type Params = { projectId: string; module: string };

/**
 * Rendered on demand, never prerendered.
 *
 * The parent `[projectId]` is genuinely unknowable at build time. Supplying
 * `generateStaticParams` for `[module]` alone leaves the parent param
 * unresolved, which produces malformed partial prerenders and breaks the route
 * at runtime. Module validity is enforced below via `moduleForSegment`, so a
 * bad segment still 404s correctly.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const module = moduleForSegment((await params).module);
  return module ? { title: module.name } : {};
}

export default async function ModulePage({ params }: { params: Promise<Params> }) {
  const { projectId, module: segment } = await params;
  const module = moduleForSegment(segment);
  if (!module) notFound();

  const enabled = isModuleEnabled(module.id);
  const related = getRelatedModules(module.id);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            {module.name}
          </h1>
          {!enabled ? <StatusBadge tone="pending">In development</StatusBadge> : null}
        </div>
        <p className="max-w-2xl text-content-secondary">{module.description}</p>
      </div>

      {enabled ? (
        // Real module interfaces mount here once a module is activated. Nothing
        // reaches this branch today, because nothing is marked enabled.
        <Panel className="p-6">
          <p className="text-sm text-content-secondary">
            Module interface not yet mounted.
          </p>
        </Panel>
      ) : (
        <PreviewInterface module={module} projectId={projectId} />
      )}

      {related.length > 0 ? (
        <section className="mt-10">
          <h2 className="hs-mono-label mb-4">Related</h2>
          <ul className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
            {related.map((item) => (
              <li key={item.id} className="bg-surface">
                <Link
                  href={item.appHref(projectId)}
                  className="group flex h-full flex-col gap-1.5 p-4 transition-colors duration-fast hover:bg-surface-raised"
                >
                  <span className="text-sm font-medium text-content group-hover:text-content-brand">
                    {item.name}
                  </span>
                  <span className="text-xs text-content-secondary">
                    {item.shortDescription}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/**
 * The preview interface.
 *
 * Shown for every module that is not yet implemented. It is deliberately
 * useful - specification, routes, and what to expect - rather than a "coming
 * soon" placeholder or, worse, a mock interface with fabricated data.
 *
 * Controls are rendered disabled with a stated reason. None of them submits
 * anything, and no request behind this page returns a fabricated success.
 */
function PreviewInterface({
  module,
  projectId,
}: {
  module: ReturnType<typeof moduleForSegment> & object;
  projectId: string;
}) {
  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <h2 className="text-sm font-medium text-content">Status</h2>
        <p className="mt-3 text-sm text-content-secondary">
          {module.name} is not implemented yet. This route shows its intended design so
          you can evaluate the fit and give feedback while changes are still cheap.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-content-secondary">
          <li>· Controls below are disabled, not silently inert.</li>
          <li>
            · The API returns{" "}
            <code className="font-mono text-xs text-content">HS_FEATURE_NOT_ENABLED</code>{" "}
            for this module - never a placeholder success.
          </li>
          <li>· No figure shown anywhere in this project is fabricated.</li>
          <li>· This route and its position are permanent.</li>
        </ul>
      </Panel>

      <Panel className="p-6">
        <h2 className="text-sm font-medium text-content">Interface preview</h2>
        <p className="mt-2 text-sm text-content-secondary">
          What this module will expose once activated.
        </p>
        <div className="mt-5 flex flex-wrap gap-6">
          <DisabledControl reason="Available when this module ships">
            Configure {module.name.toLowerCase()}
          </DisabledControl>
          <DisabledControl reason="Available when this module ships">
            View activity
          </DisabledControl>
        </div>
      </Panel>

      <Panel className="p-6">
        <h2 className="text-sm font-medium text-content">Reference</h2>
        <dl className="mt-4">
          <DefinitionRow term="Module ID">
            <code className="font-mono text-xs">{module.id}</code>
          </DefinitionRow>
          <DefinitionRow term="Route">
            <code className="font-mono text-xs">{module.appHref(projectId)}</code>
          </DefinitionRow>
          <DefinitionRow term="Documentation">
            <Link href={module.docsHref} className="text-content-brand hover:underline">
              {module.docsHref}
            </Link>
          </DefinitionRow>
          {module.publicHref ? (
            <DefinitionRow term="Product page">
              <Link
                href={module.publicHref}
                className="text-content-brand hover:underline"
              >
                {module.publicHref}
              </Link>
            </DefinitionRow>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href={module.docsHref} variant="secondary">
            Read the design
          </ButtonLink>
        </div>
      </Panel>
    </div>
  );
}
