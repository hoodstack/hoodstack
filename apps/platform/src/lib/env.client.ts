/**
 * Client-safe environment.
 *
 * Only `NEXT_PUBLIC_*` values, which Next inlines into the browser bundle at
 * build time. This module carries no secrets and is safe to import from client
 * components. The references are written in full (not computed) so Next's static
 * replacement can find and inline them.
 */
export const publicEnv = {
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
  marketingProjectId: process.env.NEXT_PUBLIC_HOODSTACK_PROJECT_ID ?? "demo",
} as const;
