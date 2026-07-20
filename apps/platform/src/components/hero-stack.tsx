import type { CSSProperties } from "react";

/**
 * The hero illustration: an isometric HoodStack.
 *
 * A hand-built SVG rather than a raster — crisp at any size, a few KB, themeable
 * via design tokens, and using our own layered-squares mark (never a third-party
 * logo). Six dark product layers with glowing edges sit under a brand-green cap;
 * energy traces feed in from the left, and the whole stack floats gently.
 *
 * Every animation is enhancement and is disabled under prefers-reduced-motion
 * (see globals.css). The static frame — the full labelled stack — carries the
 * meaning on its own.
 *
 * Pure SVG + CSS. No library, no raster.
 */

const LAYERS = [
  "Accounts",
  "Execution",
  "Gas",
  "Assets",
  "Data & automation",
  "Security",
] as const;

// Isometric slab geometry.
const CX = 178;
const RX = 96; // top-face half width
const RY = 46; // top-face half height
const D = 18; // slab thickness
const STEP = 30; // vertical distance between slab centers
const CAP_CY = 150; // the brand cap; product layers follow below

const topFace = (cy: number) =>
  `${CX},${cy - RY} ${CX + RX},${cy} ${CX},${cy + RY} ${CX - RX},${cy}`;
const leftFace = (cy: number) =>
  `${CX - RX},${cy} ${CX},${cy + RY} ${CX},${cy + RY + D} ${CX - RX},${cy + D}`;
const rightFace = (cy: number) =>
  `${CX},${cy + RY} ${CX + RX},${cy} ${CX + RX},${cy + D} ${CX},${cy + RY + D}`;

/** cap first (back), then layers front-to-... rendered back-to-front for overlap. */
const SLABS = [{ cap: true as const }, ...LAYERS.map((label) => ({ cap: false, label }))];

export function HeroStack() {
  return (
    <svg
      viewBox="0 0 500 470"
      role="img"
      aria-labelledby="herostack-title herostack-desc"
      className="mx-auto w-full max-w-xl lg:max-w-none"
    >
      <title id="herostack-title">The HoodStack</title>
      <desc id="herostack-desc">
        Six product layers — accounts, execution, gas, assets, data and automation, and
        security — stacked under the HoodStack cap, with energy converging in from
        fragmented legacy infrastructure.
      </desc>

      <defs>
        <radialGradient id="hs-hero-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--hs-brand)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--hs-brand)" stopOpacity="0" />
        </radialGradient>
        <pattern id="hs-hero-dots" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1" fill="var(--hs-border-strong)" />
        </pattern>
      </defs>

      {/* Faint dot field behind, and a soft glow beneath the stack. */}
      <rect
        x="20"
        y="60"
        width="360"
        height="360"
        fill="url(#hs-hero-dots)"
        opacity="0.4"
      />
      <ellipse cx={CX} cy="392" rx="150" ry="34" fill="url(#hs-hero-glow)" />

      {/* Energy traces feeding in from the left. */}
      {[130, 210, 292].map((y, i) => {
        const d = `M0 ${y} C 40 ${y}, 60 ${330}, ${CX - RX + 4} ${312}`;
        return (
          <g key={y}>
            <path d={d} fill="none" stroke="var(--hs-border-strong)" strokeWidth="1" />
            <path
              d={d}
              fill="none"
              stroke="var(--hs-brand)"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="hs-flow"
              style={{ animationDelay: `${i * 120}ms` } as CSSProperties}
            />
          </g>
        );
      })}

      {/* The floating stack. */}
      <g className="hs-float">
        {SLABS.map((slab, i) => {
          const cy = CAP_CY + i * STEP;
          const isCap = slab.cap;
          const top = isCap ? "var(--hs-brand)" : "var(--hs-surface-3)";
          const left = isCap ? "var(--hs-lime-700)" : "var(--hs-surface-0)";
          const right = isCap ? "var(--hs-lime-600)" : "var(--hs-surface-2)";

          return (
            <g
              key={i}
              className="hs-layer-in"
              style={{ animationDelay: `${i * 80}ms` } as CSSProperties}
            >
              <polygon points={leftFace(cy)} fill={left} />
              <polygon points={rightFace(cy)} fill={right} />
              <polygon
                points={topFace(cy)}
                fill={top}
                stroke={isCap ? "none" : "var(--hs-brand)"}
                strokeOpacity={isCap ? undefined : 0.45}
                strokeWidth={isCap ? undefined : 1}
              />

              {/* The stack mark on the cap: three nested iso diamonds. */}
              {isCap
                ? [4, -2, -8].map((dy) => (
                    <polygon
                      key={dy}
                      points={`${CX},${cy - 12 + dy} ${CX + 26},${cy + dy} ${CX},${cy + 12 + dy} ${CX - 26},${cy + dy}`}
                      fill="none"
                      stroke="var(--hs-on-brand)"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  ))
                : null}
            </g>
          );
        })}

        {/* Leader lines + labels. */}
        {SLABS.map((slab, i) => {
          const cy = CAP_CY + i * STEP;
          const midY = cy + D / 2;
          const label = slab.cap ? "HoodStack" : slab.label;
          return (
            <g key={`label-${i}`}>
              <line
                x1={CX + RX}
                y1={midY}
                x2={CX + RX + 22}
                y2={midY}
                stroke="var(--hs-border-strong)"
                strokeWidth="1"
              />
              <circle cx={CX + RX + 26} cy={midY} r="2.5" fill="var(--hs-brand)" />
              <text
                x={CX + RX + 36}
                y={midY + 4}
                fontFamily="var(--hs-font-sans)"
                fontSize={slab.cap ? "15" : "13"}
                fontWeight={slab.cap ? 600 : 500}
                fill={slab.cap ? "var(--hs-text-primary)" : "var(--hs-text-secondary)"}
              >
                {label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
