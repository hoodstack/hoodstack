import { HoodStackError } from "@hoodstack/errors";
import { simulateTransaction, type SimulationRequest } from "@hoodstack/network";
import { z } from "zod";

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

const bodySchema = z.object({
  to: z.string().min(1),
  from: z.string().optional(),
  valueWei: z.string().optional(),
  data: z.string().optional(),
});

/**
 * POST /api/v1/tx/simulate
 *
 * Simulate a transaction with eth_call and estimate its gas. Read-only: nothing
 * is signed or submitted. On a revert, `data.success` is false and
 * `data.revertReason` carries the node's message.
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = newRequestId();
  try {
    const { key, project } = await authenticateRequest(request);
    await enforceRateLimit(key.id);

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new HoodStackError("HS_INVALID_REQUEST", {
        message: "Body must be JSON: { to: string, from?, valueWei?, data? }.",
      });
    }

    const req: SimulationRequest = { to: parsed.data.to };
    if (parsed.data.from) req.from = parsed.data.from;
    if (parsed.data.valueWei) req.valueWei = parsed.data.valueWei;
    if (parsed.data.data) req.data = parsed.data.data;

    const result = await simulateTransaction(
      rpcUrlsForEnvironment(key.environment),
      req,
      { timeoutMs: 10_000 },
    );

    await recordUsage({
      projectId: project.id,
      apiKeyId: key.id,
      module: "transactions",
      action: "simulate",
      status: result.success ? "ok" : "reverted",
    }).catch(() => {});

    return jsonOk(result, requestId);
  } catch (error) {
    return jsonError(error, requestId);
  }
}
