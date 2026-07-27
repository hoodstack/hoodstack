import "server-only";

import { PrivyClient } from "@privy-io/server-auth";

import { serverEnv } from "@/lib/env";

/**
 * Server-side Privy client, lazily constructed so a missing secret only errors
 * when auth is actually exercised — not at module load, which would break the
 * whole app before it is provisioned.
 */
let client: PrivyClient | undefined;

export function getPrivyClient(): PrivyClient {
  if (client) return client;
  const env = serverEnv();
  client = new PrivyClient(env.NEXT_PUBLIC_PRIVY_APP_ID, env.PRIVY_APP_SECRET);
  return client;
}

/** The Privy access-token cookie set by the browser SDK for SSR verification. */
export const PRIVY_TOKEN_COOKIE = "privy-token";
