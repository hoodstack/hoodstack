import { HoodStackError } from "@hoodstack/errors";
import {
  IDEMPOTENT_METHODS,
  resolveRpcUrls,
  robinhood,
  robinhoodTestnet,
  rpcRequestWithFallback,
} from "@hoodstack/network";
import { z } from "zod";

import { serverEnv } from "@/lib/env";
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
  method: z.string().min(1),
  params: z.array(z.unknown()).optional(),
});

/**
 * POST /api/v1/rpc
 *
 * A read-only, authenticated proxy to Robinhood Chain. The key's environment
 * selects the network (live → mainnet, test → testnet). Only idempotent JSON-RPC
 * methods are forwarded — this endpoint never submits a transaction — and every
 * call is metered. This is the first real capability of the platform: one spine
 * that authentication, rate limiting, chain access, and usage all run through.
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = newRequestId();
  try {
    const { key, project } = await authenticateRequest(request);
    await enforceRateLimit(key.id);

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new HoodStackError("HS_INVALID_REQUEST", {
        message: "Body must be JSON of the form { method: string, params?: unknown[] }.",
      });
    }
    const { method, params = [] } = parsed.data;

    if (!IDEMPOTENT_METHODS.has(method)) {
      throw new HoodStackError("HS_UNSUPPORTED_VALUE", {
        message:
          `Method "${method}" is not permitted. The gateway forwards read-only ` +
          "JSON-RPC methods only.",
        details: { method },
      });
    }

    const chain = key.environment === "live" ? robinhood : robinhoodTestnet;
    const env = serverEnv();
    const override =
      key.environment === "live"
        ? env.HOODSTACK_RPC_URL_MAINNET
        : env.HOODSTACK_RPC_URL_TESTNET;

    const urls = resolveRpcUrls(chain, {
      environment: "production",
      allowPublicEndpoints: true,
      rpcUrls: override ? [override] : [],
    });

    const result = await rpcRequestWithFallback(urls, method, params, { timeoutMs: 10_000 });

    await recordUsage({
      projectId: project.id,
      apiKeyId: key.id,
      module: "core",
      action: "rpc",
      meta: { method, chainId: chain.id },
    }).catch(() => {});

    return jsonOk({ chainId: chain.id, method, result }, requestId);
  } catch (error) {
    return jsonError(error, requestId);
  }
}
