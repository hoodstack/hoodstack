import { readGas } from "@hoodstack/network";

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
 * GET /api/v1/gas
 *
 * Current gas price and base fee on the key's network, with a worked example
 * transfer cost. Authenticated, rate-limited, metered.
 */
export async function GET(request: Request): Promise<Response> {
  const requestId = newRequestId();
  try {
    const { key, project } = await authenticateRequest(request);
    await enforceRateLimit(key.id);

    const summary = await readGas(
      rpcUrlsForEnvironment(key.environment),
      chainForEnvironment(key.environment),
      { timeoutMs: 10_000 },
    );

    await recordUsage({
      projectId: project.id,
      apiKeyId: key.id,
      module: "gas",
      action: "price",
    }).catch(() => {});

    return jsonOk(summary, requestId);
  } catch (error) {
    return jsonError(error, requestId);
  }
}
