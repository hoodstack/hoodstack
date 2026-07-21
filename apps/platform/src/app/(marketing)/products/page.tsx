import {
  MODULE_LIST,
  PRODUCT_LIST,
  SURFACE_LABELS,
  getProductModules,
  type ModuleDefinition,
} from "@hoodstack/config";
import type { Metadata } from "next";
import { ogImages } from "@/lib/og";
import Link from "next/link";

import { Reveal } from "@/components/reveal";
import { Container, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Products",
  openGraph: { images: ogImages("Products") },
  description:
    "The eight HoodStack products for Robinhood Chain: identity, execution, " +
    "assets, connectivity, automation, security, developer platform, and network.",
};

const STATS = [
  ["Products", String(PRODUCT_LIST.length)],
  ["Modules", String(MODULE_LIST.length)],
  ["Surfaces", String(Object.keys(SURFACE_LABELS).length)],
] as const;

/**
 * Product index.
 *
 * Organized by product, not by package. A developer arriving here should be able
 * to name what they need - "I need gas sponsorship" - and find it in one step.
 * Each product is an editorial section: a sticky intro on the left, its modules
 * as self-contained cards on the right, so an odd module count leaves clean space
 * rather than an empty bordered cell.
 */
export default function ProductsPage() {
  return (
    <>
      <Container>
        <div className="border-b border-line py-20 lg:py-24">
          <div className="max-w-2xl">
            <Eyebrow>Products</Eyebrow>
            <h1 className="hs-display text-4xl text-content lg:text-5xl">
              Eight products. One stack.
            </h1>
            <p className="mt-5 text-lg text-content-secondary">
              Every product is delivered through several surfaces - SDKs, REST, CLI,
              dashboard - and every module has a permanent route from the first release.
            </p>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4">
            {STATS.map(([label, value]) => (
              <div key={label}>
                <dt className="hs-tick">{label}</dt>
                <dd className="hs-display mt-1 text-2xl text-content">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>

      {PRODUCT_LIST.map((product, index) => (
        <section key={product.id} className="border-b border-line">
          <Container>
            <div className="grid gap-10 py-14 lg:grid-cols-[19rem_1fr] lg:gap-16 lg:py-16">
              {/* Intro - sticks while its modules scroll past. */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                <span className="hs-tick tabular-nums text-content-tertiary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="hs-display mt-2 text-3xl text-content">{product.name}</h2>
                <p className="hs-mono-label mt-1">{product.tagline}</p>
                <p className="mt-4 max-w-sm text-sm text-content-secondary">
                  {product.description}
                </p>

                <ul className="mt-6 flex flex-wrap gap-1.5">
                  {product.surfaces.map((surface) => (
                    <li
                      key={surface}
                      className="rounded-control border border-line px-2 py-0.5 font-mono text-xs text-content-tertiary"
                    >
                      {SURFACE_LABELS[surface]}
                    </li>
                  ))}
                </ul>

                <Link
                  href={product.href}
                  className="hs-link mt-6 inline-flex items-center gap-1.5 text-sm text-content-brand"
                >
                  View {product.name}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              {/* Modules - self-contained cards; empty slots stay clean. */}
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {getProductModules(product.id).map((module, i) => (
                  <Reveal as="li" key={module.id} delay={i * 40}>
                    <ModuleCard module={module} />
                  </Reveal>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      ))}
    </>
  );
}

/**
 * A module card.
 *
 * Interactive and lifting when the module has a marketing page; a quiet static
 * card otherwise (operational modules such as API Keys have no public page).
 */
function ModuleCard({ module }: { module: ModuleDefinition }) {
  const body = (
    <>
      <span className="text-sm font-medium text-content">{module.name}</span>
      <span className="mt-1.5 block text-xs leading-relaxed text-content-secondary">
        {module.shortDescription}
      </span>
    </>
  );

  const base = "flex h-full flex-col rounded-card border p-4";

  if (module.publicHref) {
    return (
      <Link
        href={module.publicHref}
        className={`hs-lift group ${base} border-line bg-surface hover:border-[var(--hs-border-brand-strong)]`}
      >
        <span className="text-sm font-medium text-content group-hover:text-content-brand">
          {module.name}
        </span>
        <span className="mt-1.5 block text-xs leading-relaxed text-content-secondary">
          {module.shortDescription}
        </span>
      </Link>
    );
  }

  // Solid tokens only - Tailwind `/opacity` modifiers do not work on var() colors.
  return <div className={`${base} border-line bg-surface-inset`}>{body}</div>;
}
