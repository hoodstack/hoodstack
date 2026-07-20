"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink, cx } from "@/components/ui";

const NAV = [
  { href: "/products", label: "Products" },
  // Docs is its own site (separate chrome); open it in a new tab.
  { href: "/docs", label: "Docs", newTab: true },
  { href: "/changelog", label: "Changelog" },
  { href: "/security", label: "Security" },
];

/**
 * Floating navigation.
 *
 * A detached pill that hovers over the content, in the manner of Robinhood's and
 * Linear's chrome. It is translucent and lightly bordered at the top of the page,
 * then gains an opaque backdrop and a shadow once the page scrolls, so it stays
 * legible over any section without a hard band cutting across the design.
 *
 * The scroll listener is passive and only flips a boolean, so it does not cost a
 * layout on scroll. Everything degrades gracefully without JavaScript: the pill
 * simply renders in its resting state.
 */
export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile panel whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="fixed inset-x-0 top-0 z-sticky px-4">
      <div className="mx-auto max-w-container">
        <nav
          aria-label="Main"
          className={cx(
            "hs-nav-in mt-3 flex items-center justify-between gap-4 rounded-full border px-3 py-2 transition-all duration-slow ease-standard sm:px-4",
            // Chartreuse-tinted edge - the Robinhood accent, kept low-alpha so it
            // frames the pill rather than glowing. Firms up on scroll, when the
            // background also turns more opaque. Alpha is baked into the tokens,
            // because Tailwind's `/opacity` modifier does not work on var() colors.
            scrolled
              ? "border-[var(--hs-border-brand-soft)] bg-[var(--hs-nav-bg-scrolled)] shadow-[0_8px_24px_-14px_rgb(0_0_0/0.6),0_2px_20px_-10px_rgb(204_254_0/0.18)] backdrop-blur-xl"
              : "border-[var(--hs-border-brand-soft)] bg-[var(--hs-nav-bg)] backdrop-blur-md",
          )}
        >
          <Wordmark />

          <ul className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const linkClass =
                "hs-link rounded-control px-3 py-1.5 text-sm text-content-secondary transition-colors duration-fast hover:text-content data-[active=true]:text-content";
              return (
                <li key={item.href}>
                  {item.newTab ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={linkClass}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      data-active={isActive(item.href)}
                      className={linkClass}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <div className="hidden sm:block">
              <ButtonLink href="/app" variant="primary">
                Start building
              </ButtonLink>
            </div>

            {/* Mobile menu toggle. */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label="Toggle navigation"
              className="flex size-9 items-center justify-center rounded-full border border-line text-content-secondary transition-colors hover:text-content md:hidden"
            >
              <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
                {open ? (
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M3 6h14M3 10h14M3 14h14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile panel. */}
        {open ? (
          <div
            id="mobile-nav"
            className="hs-nav-in mt-2 rounded-surface border border-[var(--hs-border-brand-strong)] bg-[var(--hs-nav-bg-scrolled)] p-3 shadow-lg backdrop-blur-xl md:hidden"
          >
            <ul className="flex flex-col">
              {NAV.map((item) => {
                const cls =
                  "block rounded-control px-3 py-2.5 text-sm text-content-secondary transition-colors hover:bg-surface-raised hover:text-content data-[active=true]:text-content-brand";
                return (
                  <li key={item.href}>
                    {item.newTab ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={cls}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        data-active={isActive(item.href)}
                        className={cls}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
              <ThemeToggle />
              <ButtonLink href="/app" variant="primary">
                Start building
              </ButtonLink>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
