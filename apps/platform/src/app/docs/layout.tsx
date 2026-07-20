import Link from "next/link";

import { BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { DOCS_NAV, type DocsNavItem } from "@/lib/docs-nav";

/**
 * Documentation shell.
 *
 * Deliberately a *different site*: a solid, utilitarian top bar (not the
 * marketing floating pill) and a persistent left sidebar, in the manner of
 * Stripe's or Mintlify's docs. It lives outside the (marketing) route group, so
 * it never inherits the marketing nav or footer.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <DocsHeader />

      <div className="mx-auto flex w-full max-w-[92rem]">
        <DocsSidebar />

        <div className="min-w-0 flex-1">
          {/* Mobile navigation. */}
          <details className="border-b border-line px-5 py-3 lg:hidden">
            <summary className="cursor-pointer text-sm text-content-secondary">
              Documentation menu
            </summary>
            <div className="mt-4 space-y-5">
              {DOCS_NAV.map((group) => (
                <div key={group.heading}>
                  <p className="hs-mono-label mb-2">{group.heading}</p>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={item.label}>
                        <SidebarLink item={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>

          <main id="main" className="px-5 py-10 lg:px-12 lg:py-14">
            <div className="mx-auto max-w-3xl">{children}</div>
          </main>

          <footer className="border-t border-line px-5 py-8 lg:px-12">
            <div className="mx-auto flex max-w-3xl flex-col gap-2 text-xs text-content-tertiary sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} HoodStack · Apache-2.0</p>
              <Link href="/" className="hs-link hover:text-content">
                ← Back to hoodstack.io
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function DocsHeader() {
  return (
    <header className="sticky top-0 z-sticky border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[92rem] items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2 text-content">
            <BrandMark className="size-5 text-content-brand" />
            <span className="text-md font-semibold tracking-tight">HoodStack</span>
          </Link>
          <span className="rounded-control border border-[var(--hs-border-brand-strong)] px-1.5 py-0.5 font-mono text-[0.6875rem] uppercase tracking-wide text-content-brand">
            Docs
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden text-sm text-content-secondary transition-colors hover:text-content sm:block"
          >
            Back to site
          </Link>
          <a
            href="https://github.com/hoodstack"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden text-sm text-content-secondary transition-colors hover:text-content sm:block"
          >
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function DocsSidebar() {
  return (
    <aside
      className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-line px-5 py-8 lg:block"
      aria-label="Documentation"
    >
      <nav className="space-y-7">
        {DOCS_NAV.map((group) => (
          <div key={group.heading}>
            <p className="hs-mono-label mb-3">{group.heading}</p>
            <ul className="space-y-0.5 border-l border-line">
              {group.items.map((item) => (
                <li key={item.label}>
                  <SidebarLink item={item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function SidebarLink({ item }: { item: DocsNavItem }) {
  const className =
    "-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-content-secondary transition-colors hover:border-line-brand hover:text-content";

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer noopener" className={className}>
        {item.label} <span className="text-content-tertiary">↗</span>
      </a>
    );
  }
  return (
    <a href={item.href} className={className}>
      {item.label}
    </a>
  );
}
