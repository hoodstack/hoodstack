import type { CSSProperties } from "react";

/**
 * The hero illustration: a solid isometric HoodStack.
 *
 * A hand-built SVG — crisp at any size, a few KB, themeable via design tokens,
 * and using our own layered-squares mark (never a third-party logo). A solid
 * tower of six product layers under a brand-green cap: strong left/right wall
 * shading for mass, glowing chartreuse seams between layers, an emissive front
 * edge, a cap glow, energy traces feeding in, and a contact shadow.
 *
 * Animations are enhancement, disabled under prefers-reduced-motion. The static
 * frame carries the meaning on its own. Pure SVG + CSS, no library, no raster.
 */

const LAYERS = [
  "Accounts",
  "Execution",
  "Gas",
  "Assets",
  "Data & automation",
  "Security",
] as const;

// Isometric geometry. STEP === D makes a solid, seamless tower (no floating gaps).
const CX = 182;
const RX = 104; // top-face half width
const RY = 50; // top-face half height
const D = 30; // slab thickness
const CAP_CY = 140;

const cyFor = (i: number) => CAP_CY + i * D;

const topFace = (cy: number) =>
  `${CX},${cy - RY} ${CX + RX},${cy} ${CX},${cy + RY} ${CX - RX},${cy}`;
const leftFace = (cy: number) =>
  `${CX - RX},${cy} ${CX},${cy + RY} ${CX},${cy + RY + D} ${CX - RX},${cy + D}`;
const rightFace = (cy: number) =>
  `${CX},${cy + RY} ${CX + RX},${cy} ${CX + RX},${cy + D} ${CX},${cy + RY + D}`;
// The V-shaped front edges of a layer's top rhombus — drawn glowing as a seam.
const seam = (cy: number) => `M${CX - RX} ${cy} L${CX} ${cy + RY} L${CX + RX} ${cy}`;

const CAP = { cy: CAP_CY };
const BOTTOM_CY = cyFor(LAYERS.length); // front vertex of the lowest layer

export function HeroStack() {
  return (
    <svg
      viewBox="0 0 540 470"
      role="img"
      aria-labelledby="herostack-title herostack-desc"
      className="mx-auto w-full max-w-xl lg:max-w-none"
    >
      <title id="herostack-title">The HoodStack</title>
      <desc id="herostack-desc">
        A solid stack of six product layers — accounts, execution, gas, assets, data and
        automation, and security — under the HoodStack cap, with energy converging in from
        fragmented legacy infrastructure.
      </desc>

      <defs>
        <radialGradient id="hs-hero-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--hs-brand)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--hs-brand)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hs-hero-left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--hs-surface-2)" />
          <stop offset="100%" stopColor="var(--hs-surface-0)" />
        </linearGradient>
        <linearGradient id="hs-hero-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--hs-surface-3)" />
          <stop offset="100%" stopColor="var(--hs-surface-1)" />
        </linearGradient>
        <linearGradient id="hs-hero-cap" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--hs-lime-300)" />
          <stop offset="100%" stopColor="var(--hs-lime-500)" />
        </linearGradient>
        <linearGradient id="hs-hero-trace" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--hs-brand)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--hs-brand)" stopOpacity="1" />
        </linearGradient>
        <filter id="hs-hero-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <pattern id="hs-hero-dots" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1" fill="var(--hs-border-strong)" />
        </pattern>
      </defs>

      {/* Backdrop: faint dot field, a soft glow, and a contact shadow. */}
      <rect
        x="30"
        y="70"
        width="330"
        height="330"
        fill="url(#hs-hero-dots)"
        opacity="0.35"
      />
      <ellipse cx={CX} cy="418" rx="150" ry="30" fill="url(#hs-hero-glow)" />
      <ellipse cx={CX} cy="420" rx="118" ry="20" fill="var(--hs-black)" opacity="0.55" />

      {/* Energy traces feeding into the base, fading in from the left. */}
      {[150, 232, 312].map((y, i) => {
        const d = `M0 ${y} C 44 ${y}, 66 360, ${CX - RX + 6} 344`;
        return (
          <g key={y}>
            <path d={d} fill="none" stroke="var(--hs-border)" strokeWidth="1" />
            <path
              d={d}
              fill="none"
              stroke="url(#hs-hero-trace)"
              strokeWidth="1.75"
              strokeLinecap="round"
              className="hs-flow"
              style={{ animationDelay: `${i * 140}ms` } as CSSProperties}
            />
          </g>
        );
      })}

      {/* Cap glow. */}
      <ellipse
        cx={CX}
        cy={CAP.cy}
        rx="96"
        ry="46"
        fill="var(--hs-brand)"
        opacity="0.5"
        filter="url(#hs-hero-blur)"
      />

      <g className="hs-float">
        {/* Tower walls: contiguous left + right faces from cap to base. Drawn
            top-to-bottom so nearer (lower) layers overlap correctly. */}
        {[CAP, ...LAYERS.map((_, i) => ({ cy: cyFor(i + 1) }))].map((slab, i) => {
          const isCap = i === 0;
          return (
            <g
              key={i}
              className="hs-layer-in"
              style={{ animationDelay: `${i * 70}ms` } as CSSProperties}
            >
              <polygon
                points={leftFace(slab.cy)}
                fill={isCap ? "var(--hs-lime-700)" : "url(#hs-hero-left)"}
              />
              <polygon
                points={rightFace(slab.cy)}
                fill={isCap ? "var(--hs-lime-600)" : "url(#hs-hero-right)"}
              />
            </g>
          );
        })}

        {/* Cap top face + the stack mark (three nested iso diamonds). */}
        <polygon points={topFace(CAP.cy)} fill="url(#hs-hero-cap)" />
        {[5, -2, -9].map((dy) => (
          <polygon
            key={dy}
            points={`${CX},${CAP.cy - 13 + dy} ${CX + 30},${CAP.cy + dy} ${CX},${CAP.cy + 13 + dy} ${CX - 30},${CAP.cy + dy}`}
            fill="none"
            stroke="var(--hs-on-brand)"
            strokeWidth="2.25"
            strokeLinejoin="round"
          />
        ))}

        {/* Glowing seams between layers — the signature layered look. Each is a
            wide soft pass (glow) under a bright thin pass. */}
        {LAYERS.map((_, i) => {
          const cy = cyFor(i + 1);
          return (
            <g key={`seam-${i}`}>
              <path
                d={seam(cy)}
                fill="none"
                stroke="var(--hs-brand)"
                strokeWidth="5"
                strokeOpacity="0.16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={seam(cy)}
                fill="none"
                stroke="var(--hs-brand)"
                strokeWidth="1.75"
                strokeOpacity="0.85"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {/* Emissive front vertical edge. */}
        <line
          x1={CX}
          y1={CAP.cy + RY}
          x2={CX}
          y2={BOTTOM_CY + RY + D}
          stroke="var(--hs-brand)"
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />

        {/* Leader lines + labels. */}
        {[
          { label: "HoodStack", cap: true },
          ...LAYERS.map((label) => ({ label, cap: false })),
        ].map((item, i) => {
          const cy = cyFor(i);
          const midY = cy + D / 2;
          return (
            <g key={`label-${i}`}>
              <line
                x1={CX + RX}
                y1={midY}
                x2={CX + RX + 24}
                y2={midY}
                stroke="var(--hs-border-strong)"
                strokeWidth="1"
              />
              <circle cx={CX + RX + 28} cy={midY} r="2.5" fill="var(--hs-brand)" />
              <text
                x={CX + RX + 38}
                y={midY + 4}
                fontFamily="var(--hs-font-mono)"
                fontSize={item.cap ? "14" : "11.5"}
                fontWeight={item.cap ? 600 : 500}
                letterSpacing={item.cap ? "0.01em" : "0.11em"}
                fill={item.cap ? "var(--hs-text-brand)" : "var(--hs-text-secondary)"}
              >
                {item.cap ? item.label : item.label.toUpperCase()}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
