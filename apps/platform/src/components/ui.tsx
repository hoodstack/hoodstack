import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared primitives for the platform application.
 *
 * These live in the app rather than `@hoodstack/ui` for now. `@hoodstack/ui` is
 * a published package consumed by third parties, and publishing an API before
 * the surfaces that use it have shaped it produces a bad API that is then
 * expensive to change. These get extracted once the usage patterns are real.
 */

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

// ── layout ────────────────────────────────────────────────────────────────

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mx-auto w-full max-w-container px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export function Section({
  children,
  className,
  bordered = true,
}: {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <section className={cx(bordered && "hs-rule", "py-20 lg:py-28", className)}>
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="hs-mono-label mb-4">{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="hs-display text-3xl text-content lg:text-4xl">{title}</h2>
      {lead ? <p className="mt-4 text-md text-content-secondary">{lead}</p> : null}
    </div>
  );
}

// ── controls ──────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-control text-sm font-medium " +
  "transition-[color,background-color,border-color,transform] duration-base ease-standard " +
  "active:translate-y-px motion-reduce:active:translate-y-0 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0";

/**
 * Button variants.
 *
 * Chartreuse is reserved for interaction and state - hover, focus, active,
 * badges, and data visualization. It is not used as a fill for resting UI.
 * A page where the brand color is everywhere has no way left to draw the eye,
 * and reads as loud rather than considered.
 *
 * The primary action is therefore high-contrast neutral, and picks up the brand
 * only on hover and focus.
 */
const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-content text-canvas hover:bg-brand hover:text-brand-on active:bg-brand-active",
  secondary:
    "border border-line-strong text-content hover:border-line-brand hover:text-content-brand",
  ghost: "text-content-secondary hover:text-content-brand",
};

export function ButtonLink({
  href,
  variant = "primary",
  children,
  external,
  className,
}: {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  const classes = cx(buttonBase, buttonVariants[variant], "h-9 px-4", className);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

/**
 * A control that is deliberately inert.
 *
 * Used on preview routes. It is `disabled` so assistive technology reports it
 * correctly, and it always carries a reason - a control that silently does
 * nothing is worse than no control at all.
 */
export function DisabledControl({
  children,
  reason,
}: {
  children: ReactNode;
  reason: string;
}) {
  return (
    <span className="inline-flex flex-col gap-1.5">
      <button
        type="button"
        disabled
        aria-disabled="true"
        aria-describedby={undefined}
        title={reason}
        className={cx(buttonBase, buttonVariants.secondary, "h-9 px-4")}
      >
        {children}
      </button>
      <span className="text-xs text-content-tertiary">{reason}</span>
    </span>
  );
}

// ── surfaces ──────────────────────────────────────────────────────────────

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("rounded-card border border-line bg-surface", className)}>
      {children}
    </div>
  );
}

type StatusTone = "success" | "warning" | "danger" | "info" | "pending" | "neutral";

const statusTones: Record<StatusTone, string> = {
  success: "bg-status-success-bg text-status-success",
  warning: "bg-status-warning-bg text-status-warning",
  danger: "bg-status-danger-bg text-status-danger",
  info: "bg-status-info-bg text-status-info",
  pending: "bg-status-pending-bg text-status-pending",
  neutral: "bg-status-neutral-bg text-status-neutral",
};

/**
 * Status indicator.
 *
 * Always renders a text label alongside its color. Status is never communicated
 * by color alone - that fails for colorblind users and in monochrome.
 */
export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: StatusTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-xs font-medium",
        statusTones[tone],
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-pill bg-current" />
      {children}
    </span>
  );
}

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="hs-lift overflow-hidden rounded-card border border-line bg-surface-inset hover:border-line-strong">
      {label ? (
        <div className="border-b border-line px-4 py-2">
          <span className="hs-mono-label">{label}</span>
        </div>
      ) : null}
      {/* Long lines scroll within the block; the page itself must never
          scroll horizontally. */}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono text-content">{code}</code>
      </pre>
    </div>
  );
}

export function DefinitionRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-3 last:border-0 sm:flex-row sm:gap-6">
      <dt className="w-48 shrink-0 text-sm text-content-tertiary">{term}</dt>
      <dd className="text-sm text-content-secondary">{children}</dd>
    </div>
  );
}
