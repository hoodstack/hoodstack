"use server";

import {
  classifyExplorerQuery,
  getExplorerAddressUrl,
  getExplorerBlockUrl,
  getExplorerTxUrl,
  readAccountSummary,
  readBlock,
  readToken,
  readTransaction,
  type AccountSummary,
  type BlockSummary,
  type TokenSummary,
  type TransactionSummary,
} from "@hoodstack/network";

import type { KeyEnvironment } from "@/lib/api-keys";
import { requireSessionUser } from "@/lib/auth/session";
import { chainForEnvironment, rpcUrlsForEnvironment } from "@/server/chain";
import { getProjectForMember } from "@/server/projects";
import { recordUsage } from "@/server/usage";

export type ExplorerHit =
  | {
      kind: "account";
      account: AccountSummary;
      token: TokenSummary | null;
      explorerUrl: string;
    }
  | { kind: "transaction"; transaction: TransactionSummary; explorerUrl: string }
  | { kind: "block"; block: BlockSummary; explorerUrl: string }
  | { kind: "unknown" };

export type ExplorerResult = { ok: true; data: ExplorerHit } | { ok: false; error: string };

/**
 * Universal explorer search: classify the query, dispatch the matching read, and
 * return a rich view with a Blockscout deep link. For a contract address it also
 * tries to read ERC-20 metadata. Metered.
 */
export async function explorerSearchAction(input: {
  projectId: string;
  environment: KeyEnvironment;
  query: string;
}): Promise<ExplorerResult> {
  try {
    const session = await requireSessionUser();
    const project = await getProjectForMember(session.user.id, input.projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const chain = chainForEnvironment(input.environment);
    const urls = rpcUrlsForEnvironment(input.environment);
    const query = input.query.trim();
    const kind = classifyExplorerQuery(query);
    const opts = { timeoutMs: 10_000 };

    let hit: ExplorerHit;
    if (kind === "address") {
      const account = await readAccountSummary(urls, chain, query, opts);
      let token: TokenSummary | null = null;
      if (account.isContract) {
        try {
          token = await readToken(urls, chain, query, undefined, opts);
        } catch {
          token = null;
        }
      }
      hit = {
        kind: "account",
        account,
        token,
        explorerUrl: getExplorerAddressUrl(chain, account.address),
      };
    } else if (kind === "txHash") {
      const transaction = await readTransaction(urls, chain, query, opts);
      hit = { kind: "transaction", transaction, explorerUrl: getExplorerTxUrl(chain, query) };
    } else if (kind === "blockNumber") {
      const tag = query.toLowerCase() === "latest" ? ("latest" as const) : Number(query);
      const block = await readBlock(urls, tag, opts);
      hit = { kind: "block", block, explorerUrl: getExplorerBlockUrl(chain, block.number) };
    } else {
      hit = { kind: "unknown" };
    }

    await recordUsage({
      projectId: project.id,
      module: "explorer",
      action: "search",
      meta: { kind, environment: input.environment },
    }).catch(() => {});

    return { ok: true, data: hit };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Search failed." };
  }
}
