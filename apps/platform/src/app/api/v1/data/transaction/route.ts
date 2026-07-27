import { HoodStackError } from "@hoodstack/errors";
import { readTransaction } from "@hoodstack/network";

import { chainForEnvironment, rpcUrlsForEnvironment } from "@/server/chain";
import {
  authenticateRequest,
  enforceRateLimit,
  jsonError,
  jsonOk,
  newRequestId,
} from "@/server/gateway";
import { recordUsage } from "@/server/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/data/transaction?hash=0x…
 *
 * A transaction and its receipt, decoded: status, value, block, and gas used.
 * Returns `found: false` for an unknown hash rather than an error.
 */
export async function GET(request: Request): Promise<Response> {
  const requestId = newRequestId();
  try {
    const { key, project } = await authenticateRequest(request);
    await enforceRateLimit(key.id);

    const hash = new URL(request.url).searchParams.get("hash");
    if (!hash) {
      throw new HoodStackError("HS_MISSING_PARAMETER", {
        message: "Query parameter `hash` is required.",
      });
    }

    const summary = await readTransaction(
      rpcUrlsForEnvironment(key.environment),
      chainForEnvironment(key.environment),
      hash,
      { timeoutMs: 10_000 },
    );

    await recordUsage({
      projectId: project.id,
      apiKeyId: key.id,
      module: "data",
      action: "transaction",
      meta: { hash: summary.hash, found: summary.found },
    }).catch(() => {});

    return jsonOk(summary, requestId);
  } catch (error) {
    return jsonError(error, requestId);
  }
}
