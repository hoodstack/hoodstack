import { getRelatedModules, isModuleEnabled } from "@hoodstack/config";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink, Panel, StatusBadge } from "@/components/ui";
import { moduleForSegment } from "@/lib/modules";

type Params = { projectId: string; module: string };

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
          {enabled ? (
            <StatusBadge tone="success">Available</StatusBadge>
          ) : (
            <StatusBadge tone="info">Coming soon</StatusBadge>
          )}
        </div>
        <p className="max-w-2xl text-lg text-content-secondary">{module.description}</p>
      </div>

      {!enabled ? <ComingSoon module={module} projectId={projectId} /> : null}

      {related.length > 0 ? (
        <section className="mt-12">
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
 * The preview a module shows before it ships.
 *
 * Confident and forward-looking: it states what is coming and points to what is
 * usable today, without disabled controls or fabricated data. The route, its
 * position, and its identifier are permanent, so links made now keep working
 * when the module lands.
 */
function ComingSoon({
  module,
  projectId,
}: {
  module: NonNullable<ReturnType<typeof moduleForSegment>>;
  projectId: string;
}) {
  return (
    <div className="space-y-6">
      <Panel className="p-6 sm:p-8">
        <h2 className="text-sm font-medium text-content">In active development</h2>
        <p className="mt-3 max-w-2xl text-sm text-content-secondary">
          {module.name} is being built now. Its place in the dashboard and its API path
          are already fixed, so you can design around it today and it will light up here
          when it ships. Follow progress in the changelog.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href={module.docsHref}>Read the docs</ButtonLink>
          <ButtonLink href="/changelog" variant="secondary">
            View changelog
          </ButtonLink>
        </div>
      </Panel>

      <Panel className="p-6 sm:p-8">
        <h2 className="text-sm font-medium text-content">Available today</h2>
        <p className="mt-2 max-w-2xl text-sm text-content-secondary">
          Data is live: read balances, accounts, and transactions from Robinhood Chain
          through the same project and API key.
        </p>
        <div className="mt-5">
          <Link
            href={`/app/${projectId}/data`}
            className="inline-flex items-center gap-2 text-sm font-medium text-content-brand hover:underline"
          >
            Open Data
            <span aria-hidden="true">-&gt;</span>
          </Link>
        </div>
      </Panel>
    </div>
  );
}
