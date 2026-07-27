"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Reveals its children when they scroll into view.
 *
 * A restrained entrance, not a spectacle: a short rise and fade, once, the first
 * time the element is seen. Content already on screen at mount reveals at once;
 * only below-the-fold blocks wait for the observer, with a timer as a backstop so
 * nothing can stay stuck hidden. Motion is fully suppressed under
 * `prefers-reduced-motion` by the `.hs-reveal` styles.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  /** Stagger, in milliseconds, for sequences. */
  delay?: number;
  as?: "div" | "section" | "li";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Anything already on screen when we mount - the hero, the first section -
    // reveals at once. Waiting on the observer there only adds a visible lag.
    const inView = node.getBoundingClientRect().top < window.innerHeight;
    if (inView) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    // Safety net: if the observer never fires - unsupported, a headless render,
    // an odd device - reveal anyway so content is never stuck invisible.
    const fallback = window.setTimeout(() => setVisible(true), delay + 700);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [delay]);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`hs-reveal${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={{ ["--hs-reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
