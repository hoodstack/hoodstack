import "server-only";

import { getDb, usageEvents } from "@hoodstack/db";

/**
 * Record one metered unit of gateway work.
 *
 * This is the raw ledger the token-utility metering will later aggregate. It is
 * intentionally best-effort at the call site: a usage-write failure must never
 * turn a successful API call into an error for the developer, so callers wrap
 * this and swallow its rejection.
 */
export async function recordUsage(input: {
  projectId: string;
  apiKeyId: string;
  module: string;
  action: string;
  units?: number;
  status?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await getDb()
    .insert(usageEvents)
    .values({
      projectId: input.projectId,
      apiKeyId: input.apiKeyId,
      module: input.module,
      action: input.action,
      units: input.units ?? 1,
      status: input.status ?? "ok",
      meta: input.meta,
    });
}
