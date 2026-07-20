import Link from "next/link";

/**
 * Brand mark - PLACEHOLDER.
 *
 * The approved HoodStack icon has not been supplied. Per the brand rules the
 * icon must not be redrawn or substituted with a generic stack glyph, so this
 * renders a deliberately neutral geometric placeholder that is obviously not a
 * finished logo.
 *
 * Replace with the real vector at `public/brand/icon.svg` before any public
 * launch. Tracked in IMPLEMENTATION_PLAN.md under open questions.
 */
export function BrandMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role="img"
      aria-label="HoodStack (placeholder mark)"
    >
      {/* Three stacked planes - a structural stand-in, not the brand icon. */}
      <path
        d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="m3 12 9 4.5 9-4.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        opacity="0.6"
      />
      <path
        d="m3 16.5 9 4.5 9-4.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        opacity="0.3"
      />
    </svg>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-content transition-colors hover:text-content-brand"
    >
      <BrandMark className="size-5 text-content-brand" />
      <span className="text-md font-semibold tracking-tight">HoodStack</span>
    </Link>
  );
}
