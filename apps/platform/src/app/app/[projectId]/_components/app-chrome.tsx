"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatusBadge, cx } from "@/components/ui";

import { AccountMenu } from "../../_components/account-menu";
import { RouteProgress } from "./route-progress";

export type NavModule = { id: string; name: string; href: string; live: boolean };
export type NavSection = { category: string; label: string; modules: NavModule[] };

/**
 * The authenticated application chrome.
 *
 * A server layout resolves the session and project, then hands this the data it
 * needs. Interactivity lives here: the sidebar is permanent on large screens and
 * becomes a slide-over drawer on small ones, so the dashboard is fully usable on
 * a phone without the navigation ever disappearing behind a bare disclosure.
 */
export function AppChrome({
  projectName,
  email,
  chainName,
  isTestnet,
  sections,
  children,
}: {
  projectName: string;
  email: string | null;
  chainName: string;
  isTestnet: boolean;
  sections: NavSection[];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer on navigation and when returning to desktop width.
  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-sticky border-b border-line bg-[var(--hs-nav-bg)] backdrop-blur relative">
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="-ml-1 rounded-control p-1.5 text-content-secondary hover:bg-surface-raised hover:text-content lg:hidden"
            >
              <MenuIcon />
            </button>
            <Wordmark href="/app/projects" />
            <span aria-hidden="true" className="hidden text-content-tertiary sm:inline">
              /
            </span>
            <span className="hidden min-w-0 truncate text-sm font-medium text-content-secondary sm:inline">
              {projectName}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <StatusBadge tone={isTestnet ? "info" : "warning"}>
              <span className="hidden sm:inline">{chainName}</span>
              <span className="sm:hidden">{isTestnet ? "Testnet" : "Mainnet"}</span>
            </StatusBadge>
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <AccountMenu email={email} />
          </div>
        </div>
        <RouteProgress />
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Desktop sidebar. */}
        <aside
          className="hs-scroll-thin sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-line px-3 py-6 lg:block"
          aria-label="Project navigation"
        >
          <SidebarNav sections={sections} pathname={pathname} />
        </aside>

        {/* Mobile drawer. */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-modal lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-canvas">
              <div className="flex h-14 items-center justify-between border-b border-line px-4">
                <Wordmark href="/app/projects" />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-control p-1.5 text-content-secondary hover:bg-surface-raised hover:text-content"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-5">
                <SidebarNav sections={sections} pathname={pathname} />
              </div>
            </div>
          </div>
        ) : null}

        <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarNav({
  sections,
  pathname,
}: {
  sections: NavSection[];
  pathname: string;
}) {
  return (
    <nav className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.category}>
          {section.category !== "overview" ? (
            <h2 className="hs-mono-label px-2 pb-2">{section.label}</h2>
          ) : null}
          <ul className="space-y-0.5">
            {section.modules.map((module) => {
              const active = pathname === module.href;
              return (
                <li key={module.id}>
                  <Link
                    href={module.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex items-center justify-between rounded-control px-2.5 py-1.5 text-sm transition-colors duration-fast",
                      active
                        ? "bg-surface-raised text-content"
                        : "text-content-secondary hover:bg-surface-raised hover:text-content",
                    )}
                  >
                    <span className="truncate">{module.name}</span>
                    {module.live ? (
                      <span
                        aria-label="Available"
                        title="Available"
                        className="ml-2 size-1.5 shrink-0 rounded-pill bg-content-brand"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
