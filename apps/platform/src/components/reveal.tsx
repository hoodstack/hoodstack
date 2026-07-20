"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Reveals its children when they scroll into view.
 *
 * A restrained entrance, not a spectacle: a short rise and fade, once, the first
 * time the element is seen. Motion is fully suppressed under
 * `prefers-reduced-motion` by the `.hs-reveal` styles, so this is progressive
 * enhancement - the content is present and styled regardless of JavaScript.
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
    // If already in view on mount (above the fold), reveal without waiting.
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
    return () => observer.disconnect();
  }, []);

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
