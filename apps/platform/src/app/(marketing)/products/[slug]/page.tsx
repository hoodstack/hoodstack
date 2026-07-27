import {
  PRODUCT_LIST,
  SURFACE_LABELS,
  findProduct,
  getProductForModule,
  getProductModules,
  getPublicModules,
  getRelatedModules,
  isModuleEnabled,
  type ModuleDefinition,
  type ProductDefinition,
} from "@hoodstack/config";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ogImages } from "@/lib/og";

import {
  ButtonLink,
  Container,
  DefinitionRow,
  Panel,
  Section,
  SectionHeading,
} from "@/components/ui";

/**
 * Everything under `/products/`.
 *
 * Two kinds of page share this route: product hubs (`/products/identity`) and
 * module pages (`/products/gas`). Products resolve first. A registry test
 * guarantees the two namespaces never collide, so the precedence is safe.
 */

type Params = { slug: string };

function moduleForSlug(slug: string): ModuleDefinition | undefined {
  return getPublicModules().find((module) => module.publicHref === `/products/${slug}`);
}

export function generateStaticParams(): Params[] {
  return [
    ...PRODUCT_LIST.map((product) => ({ slug: product.id })),
    // Only modules whose marketing page lives under /products/ are handled by
    // this route. Token utility is canonical at /token-utility, so it is excluded.
    ...getPublicModules()
      .filter((module) => module.publicHref!.startsWith("/products/"))
      .map((module) => ({ slug: module.publicHref!.replace("/products/", "") })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (product) {
    return {
      title: product.name,
      description: product.description,
      alternates: { canonical: product.href },
      openGraph: { images: ogImages(product.name) },
    };
  }

  const module = moduleForSlug(slug);
  if (!module) return {};
  return {
    title: module.name,
    description: module.shortDescription,
    alternates: { canonical: module.publicHref! },
    openGraph: { images: ogImages(module.name) },
  };
}

export default async function ProductRoute({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const product = findProduct(slug);
  if (product) return <ProductHub product={product} />;

  const module = moduleForSlug(slug);
  if (!module) notFound();

  return <ModulePage module={module} />;
}

/* ── product hub ─────────────────────────────────────────────────────────── */

function ProductHub({ product }: { product: ProductDefinition }) {
  const modules = getProductModules(product.id);
  const liveModules = modules.filter((module) => isModuleEnabled(module.id));

  return (
    <>
      <Container>
        <div className="py-20 lg:py-24">
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link
              href="/products"
              className="text-sm text-content-tertiary transition-colors hover:text-content-brand"
            >
              ← Products
            </Link>
          </nav>

          <p className="hs-mono-label mb-4">{product.tagline}</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-content">
            {product.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-content-secondary">
            {product.description}
          </p>

          {/* How the product is consumed. This is the packages-vs-products
              distinction made concrete: one product, several surfaces. */}
          <ul className="mt-8 flex flex-wrap gap-1.5">
            {product.surfaces.map((surface) => (
              <li
                key={surface}
                className="rounded-control border border-line px-2.5 py-1 font-mono text-xs text-content-tertiary"
              >
                {SURFACE_LABELS[surface]}
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <Section>
        <Container>
          <SectionHeading title={`What's inside ${product.name}`} />
          <ul className="mt-10 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <li key={module.id} className="bg-surface">
                {module.publicHref ? (
                  <Link
                    href={module.publicHref}
                    className="group flex h-full flex-col gap-2 p-6 transition-colors duration-fast hover:bg-surface-raised"
                  >
                    <span className="text-md font-medium text-content group-hover:text-content-brand">
                      {module.name}
                    </span>
                    <span className="text-sm text-content-secondary">
                      {module.shortDescription}
                    </span>
                  </Link>
                ) : (
                  <div className="flex h-full flex-col gap-2 p-6">
                    <span className="text-md font-medium text-content">
                      {module.name}
                    </span>
                    <span className="text-sm text-content-secondary">
                      {module.shortDescription}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Container>
        <Panel className="mb-16 p-6">
          <h2 className="text-sm font-medium text-content">Availability</h2>
          {liveModules.length > 0 ? (
            <p className="mt-3 max-w-3xl text-sm text-content-secondary">
              {liveModules.length} of {modules.length}{" "}
              {modules.length === 1 ? "module" : "modules"} in {product.name}{" "}
              {liveModules.length === 1 ? "is" : "are"} available now:{" "}
              <span className="text-content">
                {liveModules.map((m) => m.name).join(", ")}
              </span>
              . The rest are in active development and appear here as they ship.
            </p>
          ) : (
            <p className="mt-3 max-w-3xl text-sm text-content-secondary">
              {product.name} is in active development. Its routes and API paths are
              fixed now, so you can design around it today, and each module lights up
              here as it ships.
            </p>
          )}
        </Panel>
      </Container>
    </>
  );
}

/* ── module page ─────────────────────────────────────────────────────────── */

function ModulePage({ module }: { module: ModuleDefinition }) {
  const enabled = isModuleEnabled(module.id);
  const related = getRelatedModules(module.id);
  const product = getProductForModule(module.id);

  return (
    <>
      <Container>
        <div className="py-20 lg:py-24">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm">
            <Link
              href="/products"
              className="text-content-tertiary transition-colors hover:text-content-brand"
            >
              Products
            </Link>
            {product ? (
              <>
                <span aria-hidden="true" className="text-content-tertiary">
                  /
                </span>
                <Link
                  href={product.href}
                  className="text-content-tertiary transition-colors hover:text-content-brand"
                >
                  {product.name}
                </Link>
              </>
            ) : null}
          </nav>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-content">
            {module.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-content-secondary">
            {module.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={module.docsHref} variant="secondary">
              Documentation
            </ButtonLink>
            <ButtonLink href="/docs#quickstart" variant="ghost">
              Quickstart
            </ButtonLink>
          </div>
        </div>
      </Container>

      {!enabled ? (
        <Container>
          <Panel className="mb-4 p-6">
            <h2 className="text-sm font-medium text-content">Coming soon</h2>
            <p className="mt-3 max-w-3xl text-sm text-content-secondary">
              {module.name} is in active development. Its route, its position in the
              application, and its API path are fixed now, so you can build around it
              today and it will light up when it ships. The URL never changes as the
              module deepens. Follow progress in the changelog.
            </p>
          </Panel>
        </Container>
      ) : null}

      <Section>
        <Container>
          <SectionHeading title="How it fits" />
          <dl className="mt-8 max-w-3xl">
            {product ? (
              <DefinitionRow term="Product">
                <Link href={product.href} className="text-content-brand hover:underline">
                  {product.name}
                </Link>
              </DefinitionRow>
            ) : null}
            <DefinitionRow term="Application route">
              <code className="font-mono text-xs">{module.appHref("[projectId]")}</code>
            </DefinitionRow>
            <DefinitionRow term="Documentation">
              <Link href={module.docsHref} className="text-content-brand hover:underline">
                {module.docsHref}
              </Link>
            </DefinitionRow>
            <DefinitionRow term="Status">
              {enabled ? "Available" : "In development - interface preview"}
            </DefinitionRow>
          </dl>
        </Container>
      </Section>

      {related.length > 0 ? (
        <Section>
          <Container>
            <SectionHeading
              title="Works with"
              lead="Modules you are likely to use alongside this one."
            />
            <ul className="mt-8 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id} className="bg-surface">
                  {item.publicHref ? (
                    <Link
                      href={item.publicHref}
                      className="group flex h-full flex-col gap-2 p-5 transition-colors duration-fast hover:bg-surface-raised"
                    >
                      <span className="text-sm font-medium text-content group-hover:text-content-brand">
                        {item.name}
                      </span>
                      <span className="text-sm text-content-secondary">
                        {item.shortDescription}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex h-full flex-col gap-2 p-5">
                      <span className="text-sm font-medium text-content">
                        {item.name}
                      </span>
                      <span className="text-sm text-content-secondary">
                        {item.shortDescription}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
