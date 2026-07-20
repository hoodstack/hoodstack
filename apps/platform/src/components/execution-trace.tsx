import type { CSSProperties } from "react";

/**
 * The signature visual: a transaction's lifecycle drawn as a financial signal.
 *
 * Robinhood's brand language is "technical illustration inspired by financial
 * graphs", and their signature is the rising line with a soft area fill. This is
 * that idea made literal and honest — the five states an actual
 * `@hoodstack/transactions` object moves through, plotted on a dot-matrix field
 * with a gradient trace, plotted-point drop lines, a finality threshold, a
 * travelling pulse, and a breathing endpoint.
 *
 * It fabricates nothing. No hash, no block number, no amount. The nodes are the
 * real state machine; the threshold is the real finality rule
 * (`confirmations >= chain.finality.defaultConfirmations`); the readout shows the
 * state *schema*, not a pretend receipt. The static final frame — fully drawn,
 * confirmed, past finality — is the meaningful one, so the motion is pure
 * enhancement (globals.css disables all of it under prefers-reduced-motion).
 *
 * Pure SVG and CSS. No canvas, no library, no raster asset.
 */

interface State {
  readonly label: string;
  /** One-word description of the transition into this state. */
  readonly note: string;
  readonly x: number;
  readonly y: number;
}

const STATES: readonly State[] = [
  { label: "created", note: "built", x: 84, y: 276 },
  { label: "simulated", note: "previewed", x: 197, y: 258 },
  { label: "sponsored", note: "gas covered", x: 310, y: 206 },
  { label: "submitted", note: "broadcast", x: 423, y: 126 },
  { label: "confirmed", note: "finalized", x: 536, y: 84 },
];

const PLOT = { left: 56, right: 560, top: 64, baseline: 296 } as const;
const THRESHOLD_Y = 102;
const LINE = "M84 276 L197 258 L310 206 L423 126 L536 84";
const AREA = `${LINE} L536 296 L84 296 Z`;
const LINE_LEN = 500;

export function ExecutionTrace() {
  const confirmed = STATES[STATES.length - 1]!;
  const passed = STATES.slice(0, -1);

  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 600 372"
        role="img"
        aria-labelledby="trace-title trace-desc"
        className="w-full"
      >
        <title id="trace-title">Transaction lifecycle</title>
        <desc id="trace-desc">
          A transaction rising through five states — created, simulated, sponsored,
          submitted, and confirmed — crossing the finality threshold at confirmation.
        </desc>

        <defs>
          <pattern id="hs-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="var(--hs-border-strong)" />
          </pattern>
          <linearGradient
            id="hs-area"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={PLOT.top}
            x2="0"
            y2={PLOT.baseline}
          >
            <stop offset="0%" stopColor="var(--hs-brand)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--hs-brand)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hs-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--hs-lime-600)" />
            <stop offset="55%" stopColor="var(--hs-lime-400)" />
            <stop offset="100%" stopColor="var(--hs-lime-300)" />
          </linearGradient>
        </defs>

        {/* Dot-matrix plot field — an instrument grid, not spreadsheet lines. */}
        <rect
          x={PLOT.left}
          y={PLOT.top}
          width={PLOT.right - PLOT.left}
          height={PLOT.baseline - PLOT.top}
          fill="url(#hs-dots)"
          opacity="0.55"
        />

        {/* Finality threshold — the real rule, drawn. */}
        <line
          x1={PLOT.left}
          y1={THRESHOLD_Y}
          x2={PLOT.right}
          y2={THRESHOLD_Y}
          stroke="var(--hs-brand)"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.5"
        />
        <text
          x={PLOT.left + 4}
          y={THRESHOLD_Y - 6}
          fontFamily="var(--hs-font-mono)"
          fontSize="9"
          letterSpacing="0.06em"
          fill="var(--hs-brand)"
          opacity="0.8"
        >
          finality
        </text>

        {/* Plotted-point drop lines. */}
        {STATES.map((s) => (
          <line
            key={`drop-${s.label}`}
            x1={s.x}
            y1={s.y}
            x2={s.x}
            y2={PLOT.baseline}
            stroke="var(--hs-brand)"
            strokeWidth="1"
            opacity="0.14"
          />
        ))}

        {/* Axis frame + ticks. */}
        <line
          x1={PLOT.left}
          y1={PLOT.top}
          x2={PLOT.left}
          y2={PLOT.baseline}
          stroke="var(--hs-border-strong)"
        />
        <line
          x1={PLOT.left}
          y1={PLOT.baseline}
          x2={PLOT.right}
          y2={PLOT.baseline}
          stroke="var(--hs-border-strong)"
        />
        {STATES.map((s) => (
          <line
            key={`tick-${s.label}`}
            x1={s.x}
            y1={PLOT.baseline}
            x2={s.x}
            y2={PLOT.baseline + 5}
            stroke="var(--hs-border-strong)"
          />
        ))}

        {/* Area fill + soft glow beneath the trace. */}
        <path d={AREA} fill="url(#hs-area)" stroke="none" />
        <path
          d={LINE}
          fill="none"
          stroke="var(--hs-brand)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.1"
        />

        {/* Faint baseline trace (reduced-motion fallback), then the gradient
            trace drawing itself in, then the travelling pulse. */}
        <path d={LINE} fill="none" stroke="var(--hs-border-strong)" strokeWidth="1.5" />
        <path
          d={LINE}
          fill="none"
          stroke="url(#hs-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="hs-signal-draw"
          style={{ ["--len" as string]: LINE_LEN }}
        />
        <path
          d={LINE}
          fill="none"
          stroke="var(--hs-lime-200)"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="hs-signal-comet"
        />

        {/* Passed states: rings that flare as the pulse crosses them. */}
        {passed.map((s, i) => (
          <circle
            key={s.label}
            cx={s.x}
            cy={s.y}
            r={4.5}
            fill="var(--hs-bg-surface)"
            stroke="var(--hs-border-strong)"
            strokeWidth="1.75"
            className="hs-signal-node"
            style={{ animationDelay: `${1500 + i * 700}ms` } as CSSProperties}
          />
        ))}

        {/* Confirmed endpoint: breathing halo, solid node, check. */}
        <circle
          cx={confirmed.x}
          cy={confirmed.y}
          r={7}
          fill="var(--hs-brand)"
          className="hs-signal-live"
        />
        <circle
          cx={confirmed.x}
          cy={confirmed.y}
          r={6}
          fill="var(--hs-brand)"
          stroke="var(--hs-bg-surface)"
          strokeWidth="1.5"
        />
        <path
          d={`M${confirmed.x - 2.6} ${confirmed.y} l1.8 1.9 l3.4 -3.8`}
          fill="none"
          stroke="var(--hs-on-brand)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* State labels + transition notes. */}
        {STATES.map((s) => (
          <g key={`label-${s.label}`}>
            <text
              x={s.x}
              y={PLOT.baseline + 22}
              textAnchor="middle"
              fontFamily="var(--hs-font-mono)"
              fontSize="10.5"
              letterSpacing="0.03em"
              fill="var(--hs-text-secondary)"
            >
              {s.label}
            </text>
            <text
              x={s.x}
              y={PLOT.baseline + 36}
              textAnchor="middle"
              fontFamily="var(--hs-font-mono)"
              fontSize="8.5"
              letterSpacing="0.02em"
              fill="var(--hs-text-tertiary)"
            >
              {s.note}
            </text>
          </g>
        ))}

        {/* Confirmed callout. */}
        <g transform={`translate(${confirmed.x - 34}, ${confirmed.y - 30})`}>
          <rect
            x={0}
            y={0}
            width={68}
            height={18}
            rx={9}
            fill="var(--hs-brand-subtle)"
            stroke="var(--hs-brand)"
            strokeWidth="0.75"
          />
          <text
            x={34}
            y={12.5}
            textAnchor="middle"
            fontFamily="var(--hs-font-mono)"
            fontSize="9.5"
            fill="var(--hs-brand)"
          >
            confirmed
          </text>
        </g>

        <text
          x={PLOT.left}
          y={50}
          fontFamily="var(--hs-font-mono)"
          fontSize="9.5"
          letterSpacing="0.08em"
          fill="var(--hs-text-tertiary)"
        >
          STATE
        </text>
      </svg>

      {/* Control-room readout. Shows the state schema, never a fabricated
          receipt — the placeholders are types, not pretend data. */}
      <figcaption className="mt-4 overflow-x-auto rounded-card border border-line bg-surface-inset px-4 py-3">
        <code className="block whitespace-pre font-mono text-xs leading-relaxed text-content-secondary">
          {`tx.state         "confirmed"
tx.confirmations  >= chain.finality.defaultConfirmations
tx.receipt        UserOperationReceipt`}
          <span className="hs-caret text-content-brand">▍</span>
        </code>
      </figcaption>
    </figure>
  );
}
