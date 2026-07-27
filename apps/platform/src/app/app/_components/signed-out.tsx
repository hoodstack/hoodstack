"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui";

/**
 * The signed-out state for the dashboard.
 *
 * Rendered by a server page when no valid session cookie is present. Once Privy
 * authenticates in the browser it sets the session cookie, so we refresh the
 * route, the server component re-runs, now sees the session, and renders the
 * real dashboard.
 */
export function SignedOut() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) router.refresh();
  }, [ready, authenticated, router]);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-container items-center px-6">
          <Wordmark href="/" />
        </div>
      </header>
      <main className="mx-auto flex max-w-container flex-col items-start px-6 py-24">
        <h1 className="text-2xl font-semibold tracking-tight text-content">
          Sign in to HoodStack
        </h1>
        <p className="mt-3 max-w-md text-content-secondary">
          Create projects, mint API keys, and call Robinhood Chain through the gateway.
        </p>
        <div className="mt-8">
          <Button onClick={login} disabled={!ready}>
            {ready ? "Sign in" : "Loading…"}
          </Button>
        </div>
      </main>
    </div>
  );
}
