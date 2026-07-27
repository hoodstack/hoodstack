import "server-only";

import { z } from "zod";

/**
 * Server-only environment.
 *
 * Importing `server-only` makes this module a build error if it is ever pulled
 * into a client bundle, so the secrets below can never leak to the browser. The
 * schema validates once, lazily, on first access; a missing or malformed value
 * fails loudly at the boundary instead of surfacing as a confusing runtime error
 * deep in a query or a token check.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (Supabase pooled, port 6543)"),
  DIRECT_URL: z.string().min(1).optional(),
  PRIVY_APP_SECRET: z.string().min(1, "PRIVY_APP_SECRET is required"),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  HOODSTACK_RPC_URL_MAINNET: z.string().url().optional().or(z.literal("")),
  HOODSTACK_RPC_URL_TESTNET: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(1, "NEXT_PUBLIC_PRIVY_APP_ID is required"),
});

type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

/**
 * Validated server environment. Call this rather than reading `process.env`
 * directly, so every consumer gets the same typed, checked view.
 */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid server environment:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
