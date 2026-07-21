import type { Metadata } from "next";
import Link from "next/link";

import { Wordmark } from "@/components/brand";
import { ButtonLink, DisabledControl, Panel } from "@/components/ui";

export const metadata: Metadata = { title: "Projects" };

/**
 * Project list.
 *
 * Authentication and project storage do not exist yet, so this shows an honest
 * empty state rather than sample projects. Fabricated rows here would be
 * discovered the moment someone tried to open one.
 *
 * The demo link is explicitly labelled as a structural preview so nobody
 * mistakes it for a real project.
 */
export default function ProjectsPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-container items-center justify-between px-6">
          <Wordmark href="/" />
          <ButtonLink href="/docs#quickstart" variant="secondary">
            Documentation
          </ButtonLink>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-container px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-content">Projects</h1>
        <p className="mt-3 max-w-2xl text-content-secondary">
          Projects isolate API keys, environments, policies, and usage. No project can
          read another project&apos;s data.
        </p>

        <Panel className="mt-10 p-8">
          <h2 className="text-md font-medium text-content">
            Authentication is not built yet
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-content-secondary">
            Sign-in, organizations, and project storage are in development. Until they
            ship there is nothing to list here - showing example projects would mean
            fabricating data you could not open.
          </p>

          <div className="mt-6 flex flex-wrap items-start gap-6">
            <DisabledControl reason="Requires authentication, which is in development">
              Create project
            </DisabledControl>
          </div>
        </Panel>

        <div className="mt-8">
          <h2 className="hs-mono-label mb-3">Structural preview</h2>
          <p className="mb-4 max-w-2xl text-sm text-content-secondary">
            The application shell and its navigation are built and can be inspected with
            any identifier in the URL. Nothing behind it is connected to a backend.
          </p>
          <Link
            href="/app/demo/overview"
            className="inline-flex items-center gap-2 rounded-control border border-line-strong px-4 py-2 text-sm text-content transition-colors hover:bg-surface-raised"
          >
            Open the app shell
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
