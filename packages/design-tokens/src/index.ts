/**
 * Design tokens as TypeScript values.
 *
 * These mirror `tokens.css`. CSS is the source of truth at runtime - these
 * values reference the custom properties rather than duplicating the literals,
 * so a theme change cannot leave the two out of sync.
 *
 * Raw hex values appear only in `palette`, for the cases that genuinely cannot
 * use a custom property: canvas rendering, SVG attribute values, meta theme
 * colors, and email.
 */

/** Raw brand scale. Chartreuse is brand identity, never a status signal. */
export const palette = {
  lime: {
    50: "#F8FFD9",
    100: "#EEFF9B",
    200: "#E2FF5C",
    300: "#D7FF29",
    400: "#D0FF0D",
    500: "#CCFE00",
    600: "#A7D000",
    700: "#789600",
    800: "#4E6200",
    900: "#2A3500",
  },
  neutral: {
    black: "#050605",
    surface0: "#080A08",
    surface1: "#0D100D",
    surface2: "#121612",
    surface3: "#181D18",
    surface4: "#1F251F",
    white: "#FFFFFF",
  },
} as const;

const v = (name: string) => `var(--hs-${name})`;

export const color = {
  bg: {
    canvas: v("bg-canvas"),
    surface: v("bg-surface"),
    surfaceRaised: v("bg-surface-raised"),
    surfaceOverlay: v("bg-surface-overlay"),
    inset: v("bg-inset"),
    hover: v("bg-hover"),
    active: v("bg-active"),
    selected: v("bg-selected"),
  },
  text: {
    primary: v("text-primary"),
    secondary: v("text-secondary"),
    tertiary: v("text-tertiary"),
    disabled: v("text-disabled"),
    inverse: v("text-inverse"),
    brand: v("text-brand"),
  },
  border: {
    default: v("border"),
    strong: v("border-strong"),
    brand: v("border-brand"),
  },
  brand: {
    default: v("brand"),
    hover: v("brand-hover"),
    active: v("brand-active"),
    subtle: v("brand-subtle"),
    on: v("on-brand"),
  },
  status: {
    success: v("status-success"),
    successBg: v("status-success-bg"),
    warning: v("status-warning"),
    warningBg: v("status-warning-bg"),
    danger: v("status-danger"),
    dangerBg: v("status-danger-bg"),
    info: v("status-info"),
    infoBg: v("status-info-bg"),
    pending: v("status-pending"),
    pendingBg: v("status-pending-bg"),
    neutral: v("status-neutral"),
    neutralBg: v("status-neutral-bg"),
  },
} as const;

export const font = {
  sans: v("font-sans"),
  mono: v("font-mono"),
  size: {
    xs: v("text-xs"),
    sm: v("text-sm"),
    base: v("text-base"),
    md: v("text-md"),
    lg: v("text-lg"),
    xl: v("text-xl"),
    "2xl": v("text-2xl"),
    "3xl": v("text-3xl"),
    "4xl": v("text-4xl"),
    "5xl": v("text-5xl"),
  },
  weight: { normal: 400, medium: 500, semibold: 600 },
} as const;

export const radius = {
  control: v("radius-control"),
  card: v("radius-card"),
  surface: v("radius-surface"),
  pill: v("radius-pill"),
} as const;

export const motion = {
  duration: {
    fast: v("duration-fast"),
    base: v("duration-base"),
    slow: v("duration-slow"),
  },
  ease: { standard: v("ease-standard"), out: v("ease-out") },
} as const;

export const zIndex = {
  base: 0,
  sticky: 10,
  dropdown: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
} as const;

export const breakpoint = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
} as const;

export const layout = {
  containerMax: "1280px",
  sidebarWidth: "248px",
  topbarHeight: "56px",
} as const;

/**
 * Categorical chart colors.
 *
 * Ordered for maximum separation between adjacent series, and chosen to remain
 * distinguishable under the common forms of color vision deficiency. Chartreuse
 * leads because it is the brand, but the sequence never relies on hue alone -
 * charts must also differentiate by shape, label, or position.
 */
export const chart = [
  "#CCFE00",
  "#58A6FF",
  "#A371F7",
  "#F0A868",
  "#3FB950",
  "#F85149",
  "#7D857A",
] as const;

export type ThemeName = "dark" | "light" | "system";

/** Attribute value written to <html>. `system` clears it and defers to the OS. */
export function themeAttribute(theme: ThemeName): string | null {
  return theme === "system" ? null : theme;
}

export const tokens = {
  palette,
  color,
  font,
  radius,
  motion,
  zIndex,
  breakpoint,
  layout,
  chart,
} as const;
