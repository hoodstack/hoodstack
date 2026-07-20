/**
 * Documentation navigation.
 *
 * The docs are a single, honest page for now — most guides are not written yet
 * (see the docs home). Internal items are in-page anchors, so nothing 404s; the
 * "Repository" group links to the architecture and security documents that
 * genuinely exist in the repo.
 *
 * When the docs grow into multiple pages, these `#anchor` hrefs become route
 * paths and the structure carries over unchanged.
 */

const REPO = "https://github.com/hoodstack/hoodstack/blob/main";

export interface DocsNavItem {
  readonly label: string;
  readonly href: string;
  readonly external?: boolean;
}

export interface DocsNavGroup {
  readonly heading: string;
  readonly items: readonly DocsNavItem[];
}

export const DOCS_NAV: readonly DocsNavGroup[] = [
  {
    heading: "Getting started",
    items: [
      { label: "Introduction", href: "#introduction" },
      { label: "Installation", href: "#installation" },
      { label: "Network setup", href: "#network" },
      { label: "Quickstart", href: "#quickstart" },
    ],
  },
  {
    heading: "Reference",
    items: [
      { label: "Error handling", href: "#errors" },
      { label: "Packages", href: "#packages" },
    ],
  },
  {
    heading: "Repository",
    items: [
      {
        label: "System overview",
        href: `${REPO}/docs/architecture/system-overview.md`,
        external: true,
      },
      {
        label: "Threat model",
        href: `${REPO}/docs/security/threat-model.md`,
        external: true,
      },
      {
        label: "Architecture decisions",
        href: `${REPO}/docs/adr`,
        external: true,
      },
      {
        label: "GitHub",
        href: "https://github.com/hoodstack",
        external: true,
      },
    ],
  },
];
