import { HoodStackError } from "@hoodstack/errors";
import { readBlock } from "@hoodstack/network";

import { rpcUrlsForEnvironment } from "@/server/chain";
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
 * GET /api/v1/data/block?number=latest
 *
 * A block header, decoded. `number` is "latest" (the default) or a non-negative
 * block number.
 */
export async function GET(request: Request): Promise<Response> {
  const requestId = newRequestId();
  try {
    const { key, project } = await authenticateRequest(request);
    await enforceRateLimit(key.id);

    const raw = new URL(request.url).searchParams.get("number");
    let blockTag: "latest" | number = "latest";
    if (raw && raw !== "latest") {
      const parsed = Number(raw);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new HoodStackError("HS_INVALID_PARAMETER", {
          message: "`number` must be a non-negative integer or \"latest\".",
          details: { number: raw },
        });
      }
      blockTag = parsed;
    }

    const summary = await readBlock(rpcUrlsForEnvironment(key.environment), blockTag, {
      timeoutMs: 10_000,
    });

    await recordUsage({
      projectId: project.id,
      apiKeyId: key.id,
      module: "data",
      action: "block",
      meta: { number: summary.number },
    }).catch(() => {});

    return jsonOk(summary, requestId);
  } catch (error) {
    return jsonError(error, requestId);
  }
}
