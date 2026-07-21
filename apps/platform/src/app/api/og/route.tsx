import { ImageResponse } from "next/og";

/**
 * Dynamic Open Graph image.
 *
 * Renders an on-brand 1200x630 card carrying the page's title, so link previews
 * on X, Slack, Discord, etc. reflect the page rather than showing a blank card.
 * The title comes from `?title=` (set per page via `lib/og.ts`); everything else
 * is fixed brand chrome. Colors are literal because Satori does not resolve CSS
 * custom properties.
 */
export const runtime = "edge";

const BLACK = "#050605";
const SURFACE = "#0d100d";
const BRAND = "#ccfe00";
const ON_BRAND = "#050605";
const TEXT = "#f4f7f2";
const TEXT_DIM = "#a6ada3";
const BORDER = "rgba(255,255,255,0.10)";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "Infrastructure built to scale.").slice(
    0,
    110,
  );
  const eyebrow = (
    searchParams.get("eyebrow") ?? "Robinhood Chain developer infrastructure"
  )
    .slice(0, 80)
    .toUpperCase();

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: `radial-gradient(1000px 500px at 100% 0%, #12180a 0%, ${BLACK} 55%)`,
        padding: "72px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Brand row. */}
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <div
          style={{
            display: "flex",
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: BRAND,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Layered-squares mark. */}
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z"
              stroke={ON_BRAND}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="m3 12 9 4.5 9-4.5"
              stroke={ON_BRAND}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="m3 16.5 9 4.5 9-4.5"
              stroke={ON_BRAND}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ fontSize: "30px", fontWeight: 700, color: TEXT }}>HoodStack</div>
      </div>

      {/* Title. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          style={{
            display: "flex",
            fontSize: "22px",
            letterSpacing: "4px",
            color: BRAND,
            fontWeight: 600,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 40 ? "68px" : "84px",
            lineHeight: 1.02,
            color: TEXT,
            fontWeight: 600,
            maxWidth: "980px",
          }}
        >
          {title}
        </div>
      </div>

      {/* Footer band. */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${BORDER}`,
          paddingTop: "28px",
          fontSize: "22px",
          color: TEXT_DIM,
        }}
      >
        <div style={{ display: "flex" }}>www.hoodstack.io</div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              width: "10px",
              height: "10px",
              borderRadius: "999px",
              background: BRAND,
            }}
          />
          <div style={{ display: "flex", color: TEXT }}>Robinhood Chain</div>
        </div>
      </div>

      {/* Decorative corner accent. */}
      <div
        style={{
          position: "absolute",
          right: "-120px",
          bottom: "-120px",
          width: "360px",
          height: "360px",
          borderRadius: "40px",
          border: `1px solid ${BORDER}`,
          transform: "rotate(45deg)",
          background: SURFACE,
        }}
      />
    </div>,
    { width: 1200, height: 630 },
  );
}
