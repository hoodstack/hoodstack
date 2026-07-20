import Image from "next/image";

/**
 * The HoodStack mascot.
 *
 * Two theme-specific assets — a dark-mode and a light-mode render — swapped by
 * CSS that follows the same resolution order as the design tokens (an explicit
 * `data-theme` wins, otherwise the system preference). Both are in the DOM; the
 * hidden one is `display:none`, so assistive technology only ever sees one.
 *
 * `next/image` optimizes and sizes the assets, and the intrinsic dimensions are
 * passed so no layout shift occurs while they load. Responsive by default: it
 * fills its column and scales down with it.
 */
export function Mascot({ className }: { className?: string }) {
  const width = 765;
  const height = 1024;

  return (
    <div className={className}>
      <div className="hs-dark-only">
        <Image
          src="/mascot_dark.png"
          alt="HoodStack mascot"
          width={width}
          height={height}
          priority
          sizes="(min-width: 1024px) 40vw, 70vw"
          className="h-auto w-full select-none"
        />
      </div>
      <div className="hs-light-only">
        <Image
          src="/mascot_light.png"
          alt="HoodStack mascot"
          width={width}
          height={height}
          priority
          sizes="(min-width: 1024px) 40vw, 70vw"
          className="h-auto w-full select-none"
        />
      </div>
    </div>
  );
}
