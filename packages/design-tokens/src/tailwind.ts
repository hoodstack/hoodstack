/**
 * Tailwind preset.
 *
 * Maps HoodStack tokens onto Tailwind's scales so `bg-surface` and
 * `text-secondary` resolve to the same custom properties the CSS uses. Because
 * every value is a `var()`, theme switching works without Tailwind knowing
 * anything about themes.
 */

const v = (name: string) => `var(--hs-${name})`;

export const hoodstackPreset = {
  theme: {
    extend: {
      colors: {
        canvas: v("bg-canvas"),
        surface: {
          DEFAULT: v("bg-surface"),
          raised: v("bg-surface-raised"),
          overlay: v("bg-surface-overlay"),
          inset: v("bg-inset"),
        },
        content: {
          DEFAULT: v("text-primary"),
          secondary: v("text-secondary"),
          tertiary: v("text-tertiary"),
          disabled: v("text-disabled"),
          inverse: v("text-inverse"),
          brand: v("text-brand"),
        },
        line: {
          DEFAULT: v("border"),
          strong: v("border-strong"),
          brand: v("border-brand"),
        },
        brand: {
          DEFAULT: v("brand"),
          hover: v("brand-hover"),
          active: v("brand-active"),
          subtle: v("brand-subtle"),
          on: v("on-brand"),
        },
        status: {
          success: v("status-success"),
          "success-bg": v("status-success-bg"),
          warning: v("status-warning"),
          "warning-bg": v("status-warning-bg"),
          danger: v("status-danger"),
          "danger-bg": v("status-danger-bg"),
          info: v("status-info"),
          "info-bg": v("status-info-bg"),
          pending: v("status-pending"),
          "pending-bg": v("status-pending-bg"),
          neutral: v("status-neutral"),
          "neutral-bg": v("status-neutral-bg"),
        },
      },
      fontFamily: {
        sans: [v("font-sans")],
        mono: [v("font-mono")],
      },
      fontSize: {
        xs: [v("text-xs"), { lineHeight: v("leading-normal") }],
        sm: [v("text-sm"), { lineHeight: v("leading-normal") }],
        base: [v("text-base"), { lineHeight: v("leading-normal") }],
        md: [v("text-md"), { lineHeight: v("leading-normal") }],
        lg: [v("text-lg"), { lineHeight: v("leading-snug") }],
        xl: [v("text-xl"), { lineHeight: v("leading-snug") }],
        "2xl": [v("text-2xl"), { lineHeight: v("leading-snug") }],
        "3xl": [v("text-3xl"), { lineHeight: v("leading-tight") }],
        "4xl": [v("text-4xl"), { lineHeight: v("leading-tight") }],
        "5xl": [v("text-5xl"), { lineHeight: v("leading-tight") }],
      },
      borderRadius: {
        control: v("radius-control"),
        card: v("radius-card"),
        surface: v("radius-surface"),
      },
      boxShadow: {
        sm: v("shadow-sm"),
        md: v("shadow-md"),
        lg: v("shadow-lg"),
      },
      maxWidth: {
        container: v("container-max"),
      },
      transitionDuration: {
        fast: "120ms",
        base: "150ms",
        slow: "180ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0.13, 1)",
      },
      zIndex: {
        sticky: "10",
        dropdown: "20",
        overlay: "30",
        modal: "40",
        toast: "50",
      },
    },
  },
};

export default hoodstackPreset;
