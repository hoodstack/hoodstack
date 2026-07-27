"use client";

import type { SimulationResult, TransactionSummary } from "@hoodstack/network";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { useNetwork } from "@/components/network/network-provider";
import { Button, DefinitionRow, StatusBadge, cx } from "@/components/ui";

import {
  lookupTransactionAction,
  simulateTransactionAction,
} from "../actions";
import type { PolicyViolation } from "@/server/policies";

type Mode = "simulate" | "track";

/**
 * Transactions console: simulate a call against the chain (with a policy check)
 * or look up a transaction by hash. Nothing is signed or submitted.
 */
export function TransactionsConsole({ projectId }: { projectId: string }) {
  const [mode, setMode] = useState<Mode>("simulate");
  const { network: environment } = useNetwork();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sim, setSim] = useState<{
    simulation: SimulationResult;
    violations: PolicyViolation[];
  } | null>(null);
  const [tx, setTx] = useState<TransactionSummary | null>(null);

  function reset() {
    setError(null);
    setSim(null);
    setTx(null);
  }

  // A simulation or lookup belongs to the network it ran on; drop it on change.
  useEffect(() => {
    setError(null);
    setSim(null);
    setTx(null);
  }, [environment]);

  function simulate(formData: FormData) {
    reset();
    const to = String(formData.get("to") ?? "").trim();
    if (!to) return setError("Enter a recipient address.");
    const valueEth = String(formData.get("value") ?? "");
    const data = String(formData.get("data") ?? "");
    startTransition(async () => {
      const result = await simulateTransactionAction({
        projectId,
        environment,
        to,
        valueEth,
        data,
      });
      if (result.ok) setSim(result.data);
      else setError(result.error);
    });
  }

  function track(formData: FormData) {
    reset();
    const hash = String(formData.get("hash") ?? "").trim();
    if (!hash) return setError("Enter a transaction hash.");
    startTransition(async () => {
      const result = await lookupTransactionAction({ projectId, environment, hash });
      if (result.ok) setTx(result.data);
      else setError(result.error);
    });
  }

  const inputClass =
    "h-9 w-full rounded-control border border-line-strong bg-surface px-3 font-mono text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-control border border-line-strong p-0.5">
          {(["simulate", "track"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                reset();
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
      </div>

      {mode === "simulate" ? (
        <form action={simulate} className="flex flex-col gap-3">
          <input name="to" placeholder="Recipient address (to)" disabled={pending} className={inputClass} spellCheck={false} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <input name="value" placeholder="Value in ETH (optional)" disabled={pending} className={inputClass} spellCheck={false} />
            <input name="data" placeholder="Calldata 0x… (optional)" disabled={pending} className={inputClass} spellCheck={false} />
          </div>
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Simulating" : "Simulate"}
            </Button>
          </div>
        </form>
      ) : (
        <form action={track} className="flex flex-col gap-3 sm:flex-row">
          <input name="hash" placeholder="0x… transaction hash" disabled={pending} className={inputClass} spellCheck={false} />
          <Button type="submit" disabled={pending}>
            {pending ? "Looking up" : "Look up"}
          </Button>
        </form>
      )}

      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      {sim ? <SimulationCard result={sim} projectId={projectId} /> : null}
      {tx ? <TransactionCard tx={tx} /> : null}
    </div>
  );
}

function SimulationCard({
  result,
  projectId,
}: {
  result: { simulation: SimulationResult; violations: PolicyViolation[] };
  projectId: string;
}) {
  const { simulation, violations } = result;
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-center gap-2">
        {simulation.success ? (
          <StatusBadge tone="success">Would succeed</StatusBadge>
        ) : (
          <StatusBadge tone="danger">Would revert</StatusBadge>
        )}
        {violations.length > 0 ? (
          <StatusBadge tone="warning">
            {violations.length} policy {violations.length === 1 ? "flag" : "flags"}
          </StatusBadge>
        ) : (
          <StatusBadge tone="neutral">Policy: clear</StatusBadge>
        )}
      </div>

      <dl className="mt-4">
        {simulation.success ? (
          <DefinitionRow term="Gas estimate">
            {simulation.gasEstimate ?? "unavailable"}
          </DefinitionRow>
        ) : (
          <DefinitionRow term="Revert reason">
            <span className="text-status-danger">{simulation.revertReason}</span>
          </DefinitionRow>
        )}
        {simulation.returnData && simulation.returnData !== "0x" ? (
          <DefinitionRow term="Return data">
            <span className="font-mono text-xs break-all">{simulation.returnData}</span>
          </DefinitionRow>
        ) : null}
      </dl>

      {violations.length > 0 ? (
        <div className="mt-4 rounded-control border border-status-warning-bg bg-status-warning-bg p-3">
          <ul className="space-y-1 text-sm text-status-warning">
            {violations.map((v) => (
              <li key={v.rule}>{v.message}</li>
            ))}
          </ul>
          <Link
            href={`/app/${projectId}/policies`}
            className="mt-2 inline-block text-xs font-medium text-content-brand hover:underline"
          >
            Review policy
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function TransactionCard({ tx }: { tx: TransactionSummary }) {
  if (!tx.found) {
    return (
      <p className="text-sm text-content-secondary">
        No transaction found for that hash on this network.
      </p>
    );
  }
  return (
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
  );
}
