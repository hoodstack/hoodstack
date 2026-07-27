import Image from "next/image";
import Link from "next/link";

/**
 * The HoodStack brand mark.
 *
 * Renders the logo from `public/logo.png`, optimized and served responsively by
 * next/image. The mark is decorative wherever it sits beside the wordmark, so it
 * is hidden from assistive technology there; the accompanying text carries the
 * name.
 */
export function BrandMark({ className = "size-6" }: { className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} aria-hidden="true">
      <Image src="/logo.png" alt="" fill sizes="48px" className="object-contain" />
    </span>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-content transition-colors hover:text-content-brand"
    >
      <BrandMark className="size-6" />
      <span className="text-md font-semibold tracking-tight">HoodStack</span>
    </Link>
  );
}
