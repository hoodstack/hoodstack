import { robinhood, robinhoodTestnet } from "@hoodstack/network";

import {
  authenticateRequest,
  enforceRateLimit,
  jsonError,
  jsonOk,
  newRequestId,
} from "@/server/gateway";
import { recordUsage } from "@/server/usage";

// Node runtime: the gateway uses node:crypto and the Postgres driver, neither of
// which runs on the edge. Never prerendered, every call is authenticated.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/health
 *
 * The smallest authenticated call: it proves an API key resolves to a project,
 * passes the rate limiter, and reports which chain the key acts against. Useful
 * as a first integration check from the SDK or curl.
 */
export async function GET(request: Request): Promise<Response> {
  const requestId = newRequestId();
  try {
    const { key, project } = await authenticateRequest(request);
    await enforceRateLimit(key.id);

    const chain = key.environment === "live" ? robinhood : robinhoodTestnet;
    await recordUsage({
      projectId: project.id,
      apiKeyId: key.id,
      module: "core",
      action: "health",
    }).catch(() => {});

    return jsonOk(
      {
        status: "ok",
        project: { id: project.id, name: project.name },
        environment: key.environment,
        chain: { id: chain.id, name: chain.name },
        time: new Date().toISOString(),
      },
      requestId,
    );
  } catch (error) {
    return jsonError(error, requestId);
  }
}
