"use client";

import { useEffect, useState } from "react";

/**
 * A relative timestamp that is hydration-safe.
 *
 * The server renders `fallback` (a stable absolute label), and this renders the
 * same string on first paint, so server and client markup match. After mount it
 * switches to a live relative label ("2m ago") and refreshes it periodically.
 */
export function TimeAgo({ iso, fallback }: { iso: string; fallback: string }) {
  const [relative, setRelative] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setRelative(toRelative(iso));
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, [iso]);

  return (
    <time dateTime={iso} title={new Date(iso).toLocaleString()}>
      {relative ?? fallback}
    </time>
  );
}

function toRelative(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
