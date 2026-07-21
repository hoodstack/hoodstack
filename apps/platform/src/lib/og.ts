/**
 * Open Graph / Twitter image for a page, rendered dynamically from its title.
 *
 * Spread into a page's `metadata.openGraph` (and reused for `twitter`) so the
 * link-preview card carries that page's title. The URL is root-relative; the
 * root layout's `metadataBase` resolves it to an absolute URL for crawlers.
 */
export function ogImages(title: string) {
  return [
    {
      url: `/api/og?title=${encodeURIComponent(title)}`,
      width: 1200,
      height: 630,
      alt: `HoodStack — ${title}`,
    },
  ];
}
