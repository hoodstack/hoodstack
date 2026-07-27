import { HoodStackError } from "@hoodstack/errors";
import { readToken } from "@hoodstack/network";

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
 * GET /api/v1/data/token?address=0x…&holder=0x…
 *
 * ERC-20 metadata (name, symbol, decimals, total supply) for a token, and
 * optionally a holder's balance. Authenticated, rate-limited, metered.
 */
export async function GET(request: Request): Promise<Response> {
  const requestId = newRequestId();
  try {
    const { key, project } = await authenticateRequest(request);
    await enforceRateLimit(key.id);

    const params = new URL(request.url).searchParams;
    const address = params.get("address");
    if (!address) {
      throw new HoodStackError("HS_MISSING_PARAMETER", {
        message: "Query parameter `address` is required.",
      });
    }
    const holder = params.get("holder") ?? undefined;

    const summary = await readToken(
      rpcUrlsForEnvironment(key.environment),
      chainForEnvironment(key.environment),
      address,
      holder,
      { timeoutMs: 10_000 },
    );

    await recordUsage({
      projectId: project.id,
      apiKeyId: key.id,
      module: "tokens",
      action: "token",
      meta: { address: summary.address },
    }).catch(() => {});

    return jsonOk(summary, requestId);
  } catch (error) {
    return jsonError(error, requestId);
  }
}
