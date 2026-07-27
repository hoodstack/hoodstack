import { HoodStackError } from "@hoodstack/errors";
import { readAccountSummary } from "@hoodstack/network";

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
 * GET /api/v1/data/account?address=0x…
 *
 * Balance, nonce, and contract-or-not for an address, on the network the key's
 * environment selects. Authenticated, rate-limited, and metered like every
 * gateway call.
 */
export async function GET(request: Request): Promise<Response> {
  const requestId = newRequestId();
  try {
    const { key, project } = await authenticateRequest(request);
    await enforceRateLimit(key.id);

    const address = new URL(request.url).searchParams.get("address");
    if (!address) {
      throw new HoodStackError("HS_MISSING_PARAMETER", {
        message: "Query parameter `address` is required.",
      });
    }

    const summary = await readAccountSummary(
      rpcUrlsForEnvironment(key.environment),
      chainForEnvironment(key.environment),
      address,
      { timeoutMs: 10_000 },
    );

    await recordUsage({
      projectId: project.id,
      apiKeyId: key.id,
      module: "data",
      action: "account",
      meta: { address: summary.address },
    }).catch(() => {});

    return jsonOk(summary, requestId);
  } catch (error) {
    return jsonError(error, requestId);
  }
}
