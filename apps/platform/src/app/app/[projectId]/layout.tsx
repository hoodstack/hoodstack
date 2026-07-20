import { buildAppNavigation } from "@hoodstack/config";
import { DEFAULT_CHAIN } from "@hoodstack/network";
import Link from "next/link";

import { Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatusBadge } from "@/components/ui";

/**
 * Authenticated application shell.
 *
 * The sidebar is generated from the module registry, so every module is present
 * from the first release and keeps its position permanently. Unimplemented
 * modules are not hidden - hiding them and adding them later breaks links and
 * teaches developers the navigation is unreliable (ADR 0005).
 */
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const sections = buildAppNavigation();

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-sticky border-b border-line bg-canvas">
        <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Wordmark href="/app/projects" />
            <span aria-hidden="true" className="text-content-tertiary">
              /
            </span>
            <span className="font-mono text-sm text-content-secondary">{projectId}</span>
          </div>

          <div className="flex items-center gap-3">
            {/*
              The active network is always visible. A developer must never have
              to guess which chain they are operating against.
            */}
            <StatusBadge tone={DEFAULT_CHAIN.isTestnet ? "info" : "warning"}>
              {DEFAULT_CHAIN.name}
            </StatusBadge>
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className="hidden w-[248px] shrink-0 border-r border-line lg:block"
          aria-label="Project navigation"
        >
          <nav className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto px-3 py-6">
            {sections.map((section, index) => {
              // Rules separate the four zones: where you are, the products,
              // how you build, and what it costs. Grouping without a heading
              // for `overview` keeps the top of the sidebar quiet.
              const startsZone =
                section.category === "identity" ||
                section.category === "developer" ||
                section.category === "settings";

              return (
                <div
                  key={section.category}
                  className={
                    (startsZone && index > 0 ? "mt-6 border-t border-line pt-6 " : "") +
                    "mb-5 last:mb-0"
                  }
                >
                  {section.category !== "overview" ? (
                    <h2 className="hs-mono-label px-2 pb-2">{section.label}</h2>
                  ) : null}
                  <ul className="space-y-0.5">
                    {section.modules.map((module) => (
                      <li key={module.id}>
                        <Link
                          href={module.appHref(projectId)}
                          className="block rounded-control px-2 py-1.5 text-sm text-content-secondary transition-colors duration-fast hover:bg-surface-raised hover:text-content"
                        >
                          {module.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Mobile navigation: the sidebar collapses to a scrollable list rather
            than disappearing, so the dashboard stays usable on a phone. */}
        <div className="min-w-0 flex-1">
          <nav
            className="border-b border-line px-4 py-3 lg:hidden"
            aria-label="Project navigation"
          >
            <details>
              <summary className="cursor-pointer text-sm text-content-secondary">
                Navigation
              </summary>
              <ul className="mt-3 space-y-0.5">
                {sections.flatMap((section) =>
                  section.modules.map((module) => (
                    <li key={module.id}>
                      <Link
                        href={module.appHref(projectId)}
                        className="block rounded-control px-2 py-1.5 text-sm text-content-secondary hover:bg-surface-raised hover:text-content"
                      >
                        <span className="text-content-tertiary">{section.label} · </span>
                        {module.name}
                      </Link>
                    </li>
                  )),
                )}
              </ul>
            </details>
          </nav>

          <main id="main" className="px-4 py-8 lg:px-8 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
