import type { CSSProperties } from "react";

import { BrandMark } from "@/components/brand";

/**
 * The hero transform: fragmented legacy infrastructure consolidating into one
 * HoodStack.
 *
 * A recreation of the concept in the design render - the "old way" (six
 * separately-built concerns, brittle and dim) flowing into a single glowing
 * HoodStack stack - but built as animated, themeable SVG + CSS rather than a
 * static raster. Uses the HoodStack stack mark, never a third-party logo.
 *
 * Every animation is enhancement: with motion disabled (globals.css) the layers
 * are present and the story still reads. Pure markup and CSS - no library.
 */

const LEGACY = [
  { label: "Wallets", warn: true },
  { label: "Key management", warn: false },
  { label: "Transactions", warn: true },
  { label: "Gas sponsorship", warn: false },
  { label: "Infrastructure", warn: true },
  { label: "Security & policies", warn: false },
] as const;

type IconName = "accounts" | "execution" | "gas" | "assets" | "data" | "security";

const LAYERS: ReadonlyArray<{ label: string; icon: IconName }> = [
  { label: "Accounts", icon: "accounts" },
  { label: "Execution", icon: "execution" },
  { label: "Gas", icon: "gas" },
  { label: "Assets", icon: "assets" },
  { label: "Data & automation", icon: "data" },
  { label: "Security", icon: "security" },
];

function LayerIcon({ name }: { name: IconName }) {
  const common = {
    viewBox: "0 0 16 16",
    className: "size-4",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "accounts":
      return (
        <svg {...common}>
          <circle cx="8" cy="5.5" r="2.5" />
          <path d="M3.5 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
        </svg>
      );
    case "execution":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z" />
        </svg>
      );
    case "gas":
      return (
        <svg {...common}>
          <path d="M8 2s4 4.5 4 7a4 4 0 1 1-8 0c0-2.5 4-7 4-7z" />
        </svg>
      );
    case "assets":
      return (
        <svg {...common}>
          <ellipse cx="8" cy="5" rx="5" ry="2" />
          <path d="M3 5v3c0 1.1 2.2 2 5 2s5-.9 5-2V5" />
        </svg>
      );
    case "data":
      return (
        <svg {...common} strokeWidth={1.8}>
          <path d="M3.5 13V8M8 13V4M12.5 13V6" />
        </svg>
      );
    case "security":
      return (
        <svg {...common}>
          <path d="M8 1.5 13 3.5v4c0 3.5-2.5 5.5-5 7-2.5-1.5-5-3.5-5-7v-4z" />
        </svg>
      );
  }
}

/** A dim, dashed "legacy" tile - one of the concerns you rebuild by hand today. */
function LegacyTile({ label, warn, i }: { label: string; warn: boolean; i: number }) {
  // Alternating slight offset gives the pile a loose, brittle feel.
  const offset = i % 2 === 0 ? "lg:translate-x-1" : "lg:-translate-x-1";
  return (
    <li
      className={`flex items-center gap-2.5 rounded-card border border-dashed border-line-strong bg-surface-inset px-3.5 py-2.5 ${offset}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block size-1.5 rounded-pill ${
          warn ? "bg-status-danger" : "bg-content-tertiary"
        }`}
      />
      <span className="text-sm text-content-tertiary">{label}</span>
    </li>
  );
}

export function HoodStackTransform() {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_7rem_1.05fr] lg:gap-4">
      {/* ── Legacy: fragmented, brittle, dim ─────────────────────────────── */}
      <div>
        <p className="hs-mono-label mb-3">The old way</p>
        <ul className="grid gap-2">
          {LEGACY.map((tile, i) => (
            <LegacyTile key={tile.label} label={tile.label} warn={tile.warn} i={i} />
          ))}
        </ul>
      </div>

      {/* ── Flow: six traces converging left → right ─────────────────────────
          One trace per legacy concern, fanning symmetrically into a single
          arrowhead. `meet` scales the SVG uniformly (no non-square stretch), so
          the curves stay smooth and the marching dashes animate evenly. */}
      <div className="relative hidden items-center justify-center lg:flex">
        <svg
          viewBox="0 0 120 300"
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          aria-hidden="true"
        >
          {[40, 84, 128, 172, 216, 260].map((y, i) => {
            const d = `M0 ${y} C 44 ${y}, 64 150, 106 150`;
            return (
              <g key={y}>
                <path
                  d={d}
                  fill="none"
                  stroke="var(--hs-border-strong)"
                  strokeWidth="1"
                />
                <path
                  d={d}
                  fill="none"
                  stroke="var(--hs-brand)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="hs-flow"
                  style={{ animationDelay: `${i * 100}ms` } as CSSProperties}
                />
              </g>
            );
          })}
          {/* Single arrowhead at the convergence point. */}
          <path d="M104 143 L120 150 L104 157 Z" fill="var(--hs-brand)" />
        </svg>
      </div>

      {/* Mobile connector. */}
      <div className="flex justify-center lg:hidden" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-6 text-content-brand">
          <path
            d="M12 4v16M6 14l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ── HoodStack: one unified, glowing stack ────────────────────────── */}
      <div className="relative mx-auto w-full max-w-xs">
        <div className="hs-float flex flex-col gap-1.5">
          {/* Brand cap with the stack mark. */}
          <div className="flex items-center gap-2 rounded-[10px] bg-brand px-4 py-3 text-brand-on shadow-[0_0_36px_-8px_rgb(204_254_0/0.55)]">
            <BrandMark className="size-5" />
            <span className="font-semibold tracking-tight">HoodStack</span>
          </div>

          {/* Product layers. */}
          {LAYERS.map((layer, i) => (
            <div
              key={layer.label}
              className="hs-layer-in relative flex items-center gap-3 rounded-[10px] border border-line bg-surface px-4 py-3 shadow-sm"
              style={{ animationDelay: `${150 + i * 90}ms` } as CSSProperties}
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-brand"
              />
              <span className="text-content-brand">
                <LayerIcon name={layer.icon} />
              </span>
              <span className="text-sm font-medium text-content">{layer.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
