"use client";

import { useLinkStatus } from "next/link";

/**
 * A spinner that appears the moment its ancestor `<Link>` starts navigating and
 * clears when the new route arrives. Rendered inside a link/button so a click
 * gives instant feedback instead of looking stuck - important for slower
 * transitions like the one into the authenticated app (Privy init).
 */
export function LinkPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden="true"
      className="ml-2 inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent align-[-2px]"
    />
  );
}
