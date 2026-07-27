"use client";

import type { AccountSummary, TransactionSummary } from "@hoodstack/network";
import { useState, useTransition } from "react";

import type { KeyEnvironment } from "@/lib/api-keys";
import { Button, DefinitionRow, StatusBadge, cx } from "@/components/ui";

import { lookupAccountAction, lookupTransactionAction } from "./actions";

type Mode = "account" | "transaction";

/**
 * The Data module's interactive console.
 *
 * Looks up an account or a transaction against the selected network, calling the
 * same read logic the public API uses via a server action. The result is
 * rendered as labelled fields rather than raw JSON so it reads as a product, not
 * a debugger.
 */
export function DataConsole({ projectId }: { projectId: string }) {
  const [mode, setMode] = useState<Mode>("account");
  const [environment, setEnvironment] = useState<KeyEnvironment>("test");
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [tx, setTx] = useState<TransactionSummary | null>(null);

  function reset() {
    setError(null);
    setAccount(null);
    setTx(null);
  }

  function run() {
    reset();
    const query = value.trim();
    if (!query) {
      setError(mode === "account" ? "Enter an address." : "Enter a transaction hash.");
      return;
    }
    startTransition(async () => {
      if (mode === "account") {
        const result = await lookupAccountAction({ projectId, environment, address: query });
        if (result.ok) setAccount(result.data);
        else setError(result.error);
      } else {
        const result = await lookupTransactionAction({ projectId, environment, hash: query });
        if (result.ok) setTx(result.data);
        else setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        {/* Mode. */}
        <div className="inline-flex rounded-control border border-line-strong p-0.5">
          {(["account", "transaction"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                reset();
                setValue("");
              }}
              className={cx(
                "rounded-[calc(var(--hs-radius-control)-2px)] px-3 py-1 text-sm capitalize transition-colors",
                mode === m
                  ? "bg-content text-canvas"
                  : "text-content-secondary hover:text-content",
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Network. */}
        <select
          value={environment}
          onChange={(e) => {
            setEnvironment(e.target.value as KeyEnvironment);
            reset();
          }}
          disabled={pending}
          className="h-9 rounded-control border border-line-strong bg-surface px-3 text-sm text-content focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50"
        >
          <option value="test">Testnet</option>
          <option value="live">Mainnet</option>
        </select>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-start"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={mode === "account" ? "0x… address" : "0x… transaction hash"}
          disabled={pending}
          spellCheck={false}
          className="h-9 flex-1 rounded-control border border-line-strong bg-surface px-3 font-mono text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Reading…" : "Look up"}
        </Button>
      </form>

      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      {account ? (
        <dl className="rounded-card border border-line bg-surface p-5">
          <DefinitionRow term="Address">
            <span className="font-mono text-xs break-all">{account.address}</span>
          </DefinitionRow>
          <DefinitionRow term="Balance">{account.balanceFormatted}</DefinitionRow>
          <DefinitionRow term="Nonce">{account.nonce}</DefinitionRow>
          <DefinitionRow term="Type">
            <StatusBadge tone={account.isContract ? "info" : "neutral"}>
              {account.isContract ? "Contract" : "Externally-owned"}
            </StatusBadge>
          </DefinitionRow>
          <DefinitionRow term="Chain ID">{account.chainId}</DefinitionRow>
        </dl>
      ) : null}

      {tx ? (
        !tx.found ? (
          <p className="text-sm text-content-secondary">
            No transaction found for that hash on this network.
          </p>
        ) : (
          <dl className="rounded-card border border-line bg-surface p-5">
            <DefinitionRow term="Status">
              <StatusBadge
                tone={
                  tx.status === "success"
                    ? "success"
                    : tx.status === "reverted"
                      ? "danger"
                      : "pending"
                }
              >
                {tx.status}
              </StatusBadge>
            </DefinitionRow>
            <DefinitionRow term="From">
              <span className="font-mono text-xs break-all">{tx.from}</span>
            </DefinitionRow>
            <DefinitionRow term="To">
              <span className="font-mono text-xs break-all">{tx.to ?? "-"}</span>
            </DefinitionRow>
            <DefinitionRow term="Value">{tx.valueFormatted}</DefinitionRow>
            <DefinitionRow term="Block">{tx.blockNumber ?? "pending"}</DefinitionRow>
            <DefinitionRow term="Gas used">{tx.gasUsed ?? "-"}</DefinitionRow>
          </dl>
        )
      ) : null}
    </div>
  );
}
