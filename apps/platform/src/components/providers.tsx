"use client";

import { PrivyProvider } from "@privy-io/react-auth";

import { publicEnv } from "@/lib/env.client";

/**
 * Client providers for the authenticated app.
 *
 * Privy owns authentication and (optionally) embedded wallets. It is mounted
 * only around `/app`, never the marketing site, so the public pages stay fully
 * static and carry no auth bundle. The accent matches the brand chartreuse so
 * the login modal reads as part of HoodStack.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={publicEnv.privyAppId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#ccfe00",
        },
        loginMethods: ["email", "google", "github", "wallet"],
        embeddedWallets: { createOnLogin: "users-without-wallets" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
