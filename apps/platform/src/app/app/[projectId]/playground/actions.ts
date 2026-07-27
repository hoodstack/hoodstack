"use server";

import {
  readAccountSummary,
  readBlock,
  readGas,
  readToken,
  readTransaction,
  simulateTransaction,
  type SimulationRequest,
} from "@hoodstack/network";

import type { KeyEnvironment } from "@/lib/api-keys";
import { requireSessionUser } from "@/lib/auth/session";
import { chainForEnvironment, rpcUrlsForEnvironment } from "@/server/chain";
import { getProjectForMember } from "@/server/projects";
import { recordUsage } from "@/server/usage";

export type PlaygroundResult = { ok: true; data: unknown } | { ok: false; error: string };

/**
 * Run one of the live read endpoints against the project's network. Authorized by
 * session and membership (no key needed in the dashboard), and metered like any
 * call. This is the same logic the public API serves.
 */
export async function runPlaygroundAction(input: {
  projectId: string;
  environment: KeyEnvironment;
  endpoint: string;
  params: Record<string, string>;
}): Promise<PlaygroundResult> {
  try {
    const session = await requireSessionUser();
    const project = await getProjectForMember(session.user.id, input.projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const chain = chainForEnvironment(input.environment);
    const urls = rpcUrlsForEnvironment(input.environment);
    const opts = { timeoutMs: 10_000 };
    const p = input.params;

    let data: unknown;
    switch (input.endpoint) {
      case "account":
        data = await readAccountSummary(urls, chain, p["address"] ?? "", opts);
        break;
      case "transaction":
        data = await readTransaction(urls, chain, p["hash"] ?? "", opts);
        break;
      case "block": {
        const raw = p["number"] ?? "latest";
        data = await readBlock(
          urls,
          raw.toLowerCase() === "latest" ? "latest" : Number(raw),
          opts,
        );
        break;
      }
      case "token":
        data = await readToken(
          urls,
          chain,
          p["address"] ?? "",
          p["holder"] || undefined,
          opts,
        );
        break;
      case "gas":
        data = await readGas(urls, chain, opts);
        break;
      case "simulate": {
        const req: SimulationRequest = { to: p["to"] ?? "" };
        if (p["valueWei"]) req.valueWei = p["valueWei"];
        if (p["data"]) req.data = p["data"];
        data = await simulateTransaction(urls, req, opts);
        break;
      }
      default:
        return { ok: false, error: "Unknown endpoint." };
    }

    await recordUsage({
      projectId: project.id,
      module: "playground",
      action: input.endpoint,
      meta: { environment: input.environment },
    }).catch(() => {});

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Request failed." };
  }
}
