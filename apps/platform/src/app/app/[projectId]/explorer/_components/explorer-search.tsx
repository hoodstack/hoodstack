"use client";

import { useState, useTransition } from "react";

import type { KeyEnvironment } from "@/lib/api-keys";
import { DefinitionRow, StatusBadge, cx } from "@/components/ui";

import { explorerSearchAction, type ExplorerHit } from "../actions";

/** Universal explorer search: one box for an address, tx hash, or block. */
export function ExplorerSearch({ projectId }: { projectId: string }) {
  const [environment, setEnvironment] = useState<KeyEnvironment>("test");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hit, setHit] = useState<ExplorerHit | null>(null);

  function search(formData: FormData) {
    setError(null);
    setHit(null);
    const query = String(formData.get("query") ?? "").trim();
    if (!query) return setError("Enter an address, transaction hash, or block number.");
    startTransition(async () => {
      const result = await explorerSearchAction({ projectId, environment, query });
      if (result.ok) setHit(result.data);
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <div className="inline-flex rounded-control border border-line-strong p-0.5">
          {(["test", "live"] as const).map((env) => (
            <button
              key={env}
              type="button"
              onClick={() => {
                setEnvironment(env);
                setHit(null);
                setError(null);
              }}
              className={cx(
                "rounded-[calc(var(--hs-radius-control)-2px)] px-3 py-1 text-sm transition-colors",
                environment === env
                  ? "bg-content text-canvas"
                  : "text-content-secondary hover:text-content",
              )}
            >
              {env === "test" ? "Testnet" : "Mainnet"}
            </button>
          ))}
        </div>
      </div>

      <form action={search} className="flex flex-col gap-3 sm:flex-row">
        <input
          name="query"
          placeholder="Address, transaction hash, or block number"
          disabled={pending}
          spellCheck={false}
          className="h-10 w-full rounded-control border border-line-strong bg-surface px-3 font-mono text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-10 shrink-0 rounded-control bg-content px-5 text-sm font-medium text-canvas transition-colors hover:bg-brand hover:text-brand-on disabled:opacity-50"
        >
          {pending ? "Searching" : "Search"}
        </button>
      </form>

      {error ? <p className="text-sm text-status-danger">{error}</p> : null}
      {hit ? <Result hit={hit} /> : null}
    </div>
  );
}

function Result({ hit }: { hit: ExplorerHit }) {
  if (hit.kind === "unknown") {
    return (
      <p className="text-sm text-content-secondary">
        That does not look like an address, transaction hash, or block number.
      </p>
    );
  }

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <StatusBadge tone="info">{LABELS[hit.kind]}</StatusBadge>
        <a
          href={hit.explorerUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs font-medium text-content-brand hover:underline"
        >
          View on Blockscout
        </a>
      </div>

      {hit.kind === "account" ? (
        <dl>
          <DefinitionRow term="Address">
            <span className="font-mono text-xs break-all">{hit.account.address}</span>
          </DefinitionRow>
          <DefinitionRow term="Type">
            <StatusBadge tone={hit.account.isContract ? "info" : "neutral"}>
              {hit.account.isContract ? "Contract" : "Wallet"}
            </StatusBadge>
          </DefinitionRow>
          <DefinitionRow term="Balance">{hit.account.balanceFormatted}</DefinitionRow>
          <DefinitionRow term="Nonce">{hit.account.nonce}</DefinitionRow>
          {hit.token ? (
            <DefinitionRow term="Token">
              {hit.token.name} ({hit.token.symbol}), {hit.token.totalSupplyFormatted}{" "}
              supply
            </DefinitionRow>
          ) : null}
        </dl>
      ) : null}

      {hit.kind === "transaction" ? (
        !hit.transaction.found ? (
          <p className="text-sm text-content-secondary">
            No transaction found for that hash on this network.
          </p>
        ) : (
          <dl>
            <DefinitionRow term="Status">
              <StatusBadge
                tone={
                  hit.transaction.status === "success"
                    ? "success"
                    : hit.transaction.status === "reverted"
                      ? "danger"
                      : "pending"
                }
              >
                {hit.transaction.status}
              </StatusBadge>
            </DefinitionRow>
            <DefinitionRow term="From">
              <span className="font-mono text-xs break-all">{hit.transaction.from}</span>
            </DefinitionRow>
            <DefinitionRow term="To">
              <span className="font-mono text-xs break-all">
                {hit.transaction.to ?? "-"}
              </span>
            </DefinitionRow>
            <DefinitionRow term="Value">{hit.transaction.valueFormatted}</DefinitionRow>
            <DefinitionRow term="Block">
              {hit.transaction.blockNumber ?? "pending"}
            </DefinitionRow>
          </dl>
        )
      ) : null}

      {hit.kind === "block" ? (
        <dl>
          <DefinitionRow term="Number">#{hit.block.number.toLocaleString()}</DefinitionRow>
          <DefinitionRow term="Transactions">{hit.block.transactionCount}</DefinitionRow>
          <DefinitionRow term="Timestamp">
            {new Date(hit.block.timestamp).toLocaleString()}
          </DefinitionRow>
          <DefinitionRow term="Gas used">{hit.block.gasUsed}</DefinitionRow>
        </dl>
      ) : null}
    </div>
  );
}

const LABELS: Record<"account" | "transaction" | "block", string> = {
  account: "Account",
  transaction: "Transaction",
  block: "Block",
};
