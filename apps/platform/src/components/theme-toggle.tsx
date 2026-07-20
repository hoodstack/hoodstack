"use client";

import { useEffect, useState } from "react";

import { THEME_STORAGE_KEY } from "@/lib/theme";

type Theme = "dark" | "light" | "system";

const OPTIONS: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/**
 * Theme selector.
 *
 * Writes `data-theme` on <html> and persists the choice. `system` removes the
 * attribute entirely so the `prefers-color-scheme` media query in tokens.css
 * takes over, rather than snapshotting the OS preference at click time - a
 * snapshot would stop tracking the OS when it changes later.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    setTheme(stored === "dark" || stored === "light" ? stored : "system");
    setMounted(true);
  }, []);

  function apply(next: Theme) {
    setTheme(next);
    if (next === "system") {
      localStorage.removeItem(THEME_STORAGE_KEY);
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, next);
      document.documentElement.setAttribute("data-theme", next);
    }
  }

  return (
    <fieldset
      className="flex items-center gap-0.5 rounded-control border border-line p-0.5"
      // Until mounted, the rendered state cannot reflect localStorage. Marking
      // it busy avoids announcing a selection that may be about to change.
      aria-busy={!mounted}
    >
      <legend className="sr-only">Color theme</legend>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => apply(option.value)}
          aria-pressed={mounted && theme === option.value}
          className={
            "rounded-[2px] px-2 py-1 text-xs transition-colors duration-fast " +
            (mounted && theme === option.value
              ? "bg-surface-raised text-content"
              : "text-content-tertiary hover:text-content-secondary")
          }
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
