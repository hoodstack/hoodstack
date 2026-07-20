import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { chart, color, palette, themeAttribute, tokens } from "./index.js";

const css = readFileSync(fileURLToPath(new URL("./tokens.css", import.meta.url)), "utf8");

/** Extracts every `--hs-*` custom property declared anywhere in the stylesheet. */
const declared = new Set(
  [...css.matchAll(/^\s*(--hs-[a-z0-9-]+)\s*:/gim)].map((match) => match[1]!),
);

/** Extracts every `--hs-*` referenced by the TypeScript token objects. */
function referencedVars(value: unknown, out: Set<string> = new Set()): Set<string> {
  if (typeof value === "string") {
    for (const match of value.matchAll(/var\((--hs-[a-z0-9-]+)\)/g)) out.add(match[1]!);
  } else if (typeof value === "object" && value !== null) {
    for (const nested of Object.values(value)) referencedVars(nested, out);
  }
  return out;
}

describe("token parity", () => {
  it("declares every custom property the TypeScript tokens reference", () => {
    // The failure this guards against is silent: a renamed CSS variable leaves
    // `var(--hs-old-name)` resolving to nothing, and the component renders
    // transparent or unstyled rather than throwing.
    for (const name of referencedVars(tokens)) {
      expect(declared, `${name} is referenced but never declared`).toContain(name);
    }
  });

  it("defines the full chartreuse scale", () => {
    for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      expect(declared).toContain(`--hs-lime-${step}`);
    }
    expect(palette.lime[500]).toBe("#CCFE00");
  });
});

describe("theming", () => {
  it("provides a light theme override for every semantic color", () => {
    const lightBlock = css.slice(css.indexOf('[data-theme="light"]'));
    for (const name of ["bg-canvas", "text-primary", "border", "status-danger"]) {
      expect(lightBlock, `light theme is missing --hs-${name}`).toContain(
        `--hs-${name}:`,
      );
    }
  });

  it("lets an explicit choice override the system preference", () => {
    // The media query must not apply when data-theme is set, or the toggle
    // would be silently ignored for users whose OS disagrees.
    expect(css).toContain(":root:not([data-theme])");
  });

  it("maps theme names to the attribute value", () => {
    expect(themeAttribute("dark")).toBe("dark");
    expect(themeAttribute("light")).toBe("light");
    expect(themeAttribute("system")).toBeNull();
  });

  it("declares color-scheme so native controls match the theme", () => {
    expect(css).toContain("color-scheme: dark");
    expect(css).toContain("color-scheme: light");
  });
});

describe("accessibility commitments", () => {
  it("keeps a visible focus indicator", () => {
    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline: 2px solid var(--hs-focus-ring)");
  });

  it("honours reduced-motion", () => {
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("keeps status colors distinct from the brand", () => {
    // A chartreuse "success" next to a chartreuse brand is unreadable, and
    // status must never be communicated by a color the brand also uses.
    const brandHexes = new Set(Object.values(palette.lime).map((c) => c.toLowerCase()));
    const statusBlock = css.slice(css.indexOf("--hs-status-success:"));
    const statusHexes = [
      ...statusBlock.matchAll(/--hs-status-[a-z]+:\s*(#[0-9a-f]{6})/gi),
    ].map((m) => m[1]!.toLowerCase());

    expect(statusHexes.length).toBeGreaterThan(0);
    for (const hex of statusHexes) {
      expect(
        brandHexes,
        `status color ${hex} collides with the brand scale`,
      ).not.toContain(hex);
    }
  });
});

describe("chart palette", () => {
  it("has no duplicate series colors", () => {
    expect(new Set(chart).size).toBe(chart.length);
  });

  it("leads with the brand color", () => {
    expect(chart[0]).toBe(palette.lime[500]);
  });
});

describe("semantic layer", () => {
  it("exposes every status through the semantic token object", () => {
    for (const key of [
      "success",
      "warning",
      "danger",
      "info",
      "pending",
      "neutral",
    ] as const) {
      expect(color.status[key]).toMatch(/^var\(--hs-status-/);
    }
  });
});
