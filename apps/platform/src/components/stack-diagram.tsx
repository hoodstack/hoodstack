/**
 * "Everything under the hood" - the platform architecture visualization.
 *
 * Hand-built SVG and CSS. No raster asset, no generated imagery. Three stacked
 * execution planes with connecting traces, aligned to a strict grid.
 *
 * Accessibility: the SVG is decorative and marked `aria-hidden`, because a
 * screen reader cannot usefully linearize a layered diagram. The same content
 * is available as a real definition list immediately below it - that list is
 * the accessible representation, not a fallback nobody reads.
 */

const APPLICATION = [
  "DeFi",
  "Payments",
  "RWA",
  "Stock tokens",
  "Consumer",
  "Marketplaces",
  "Agents",
];

const HOODSTACK = [
  "Auth",
  "Accounts",
  "Sessions",
  "Policies",
  "Transactions",
  "Gas",
  "Tokens",
  "Data",
  "Webhooks",
  "Security",
  "Agents",
  "Treasury",
  "SDKs",
];

const CHAIN = [
  "RPC",
  "Smart contracts",
  "ERC-4337",
  "Blockscout",
  "Canonical assets",
  "Ethereum settlement",
];

function Plane({
  label,
  items,
  accent = false,
}: {
  label: string;
  items: readonly string[];
  accent?: boolean;
}) {
  return (
    <div
      className={
        "relative rounded-card border px-5 py-5 transition-colors duration-slow " +
        (accent
          ? "border-line-brand/40 bg-brand-subtle/40"
          : "border-line bg-surface hover:border-line-strong")
      }
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <span className="hs-mono-label">{label}</span>
        {accent ? (
          <span className="hs-mono-label text-content-brand">HoodStack</span>
        ) : null}
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={
              "rounded-control border px-2.5 py-1 text-xs transition-colors duration-fast " +
              (accent
                ? "border-line-brand/30 bg-canvas/40 text-content"
                : "border-line bg-surface-raised text-content-secondary")
            }
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Vertical connecting traces between planes. Decorative. */
function Traces() {
  return (
    <div className="relative h-10" aria-hidden="true">
      <svg
        viewBox="0 0 800 40"
        preserveAspectRatio="none"
        className="h-full w-full"
        focusable="false"
      >
        {[120, 280, 400, 520, 680].map((x) => (
          <g key={x}>
            <line
              x1={x}
              y1="0"
              x2={x}
              y2="40"
              stroke="var(--hs-border-strong)"
              strokeWidth="1"
            />
            <circle cx={x} cy="20" r="2" fill="var(--hs-brand)" opacity="0.55" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export function StackDiagram() {
  return (
    <div>
      <div aria-hidden="true">
        <Plane label="Application layer" items={APPLICATION} />
        <Traces />
        <Plane label="HoodStack layer" items={HOODSTACK} accent />
        <Traces />
        <Plane label="Robinhood Chain" items={CHAIN} />
      </div>

      {/* The accessible equivalent of the diagram above. */}
      <dl className="sr-only">
        <dt>Application layer</dt>
        <dd>{APPLICATION.join(", ")}</dd>
        <dt>HoodStack layer</dt>
        <dd>{HOODSTACK.join(", ")}</dd>
        <dt>Robinhood Chain layer</dt>
        <dd>{CHAIN.join(", ")}</dd>
      </dl>
    </div>
  );
}
