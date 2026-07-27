import { publicEnv } from "@/lib/env.client";

import { Providers } from "@/components/providers";
import { Wordmark } from "@/components/brand";

/**
 * Layout for the authenticated app.
 *
 * Everything under `/app` is dynamic and per-user, so this subtree is wrapped in
 * the Privy provider. Before Privy is provisioned (no app id), we render an
 * honest configuration notice instead of mounting the provider — which would
 * otherwise throw in the browser — so the marketing build stays unaffected.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  if (!publicEnv.privyAppId) {
    return <NotConfigured />;
  }
  return <Providers>{children}</Providers>;
}

function NotConfigured() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-container items-center px-6">
          <Wordmark href="/" />
        </div>
      </header>
      <main className="mx-auto max-w-container px-6 py-24">
        <h1 className="text-2xl font-semibold tracking-tight text-content">
          Authentication is not configured
        </h1>
        <p className="mt-3 max-w-xl text-content-secondary">
          The dashboard needs a Privy app id. Set{" "}
          <code className="font-mono text-content">NEXT_PUBLIC_PRIVY_APP_ID</code> (and the
          matching <code className="font-mono text-content">PRIVY_APP_SECRET</code>) in the
          environment, then reload.
        </p>
      </main>
    </div>
  );
}
