"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * A slim navigation progress bar under the header.
 *
 * App pages are dynamic and do a server round-trip, so a click can take a beat.
 * This starts a trickling bar the moment an internal link is clicked and finishes
 * it when the new route commits (the pathname changes), so a navigation never
 * looks stuck. It lives in the persistent shell, so it survives the page swap it
 * is reporting on.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const active = useRef(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopTrickle() {
    if (trickle.current) {
      clearInterval(trickle.current);
      trickle.current = null;
    }
  }

  function start() {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    stopTrickle();
    active.current = true;
    setVisible(true);
    setProgress(8);
    // Ease toward 90% and hold there until the route commits.
    trickle.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.max(0.6, (90 - p) * 0.08)));
    }, 240);
  }

  function finish() {
    if (!active.current) return;
    active.current = false;
    stopTrickle();
    setProgress(100);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
  }

  // Start on any left-click of an internal link that will actually navigate.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("#")
      ) {
        return;
      }
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same page: no navigation will happen, so do not start a bar that hangs.
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }
      start();
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // The route committed: finish whatever is in flight. `finish` is a stable
  // closure over refs, so re-running only on pathname change is correct.
  useEffect(() => {
    finish();
  }, [pathname]);

  // Cleanup timers on unmount.
  useEffect(
    () => () => {
      stopTrickle();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden"
    >
      <div
        className="h-full bg-content-brand transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          boxShadow: "0 0 8px var(--hs-text-brand), 0 0 3px var(--hs-text-brand)",
        }}
      />
    </div>
  );
}
