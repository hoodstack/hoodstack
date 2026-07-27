"use client";

import type { GasSummary } from "@hoodstack/network";
import { useCallback, useEffect, useState } from "react";

import { useNetwork } from "@/components/network/network-provider";
import { Skeleton } from "@/components/ui";

import { getGasAction } from "../actions";

type State =
  | { status: "loading" }
  | { status: "success"; data: GasSummary }
  | { status: "error"; error: string };

/** Live gas tracker with loading, success, and error states. */
export function GasTracker({ projectId }: { projectId: string }) {
  const { network } = useNetwork();
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = await getGasAction({ projectId, environment: network });
    setState(
      result.ok
        ? { status: "success", data: result.data }
        : { status: "error", error: result.error },
    );
  }, [projectId, network]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="rounded-card border border-line bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="hs-mono-label">Live gas</h2>
        <button
          type="button"
          onClick={() => void load()}
          disabled={state.status === "loading"}
          className="text-xs text-content-tertiary transition-colors hover:text-content disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {state.status === "loading" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="mt-6">
          <p className="text-sm text-status-danger">{state.error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 text-sm font-medium text-content-brand hover:underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      {state.status === "success" ? (
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <Metric label="Gas price" value={`${state.data.gasPriceGwei} gwei`} large />
          <Metric
            label="Base fee"
            value={state.data.baseFeeWei ? `${toGwei(state.data.baseFeeWei)} gwei` : "n/a"}
          />
          <Metric label="Transfer cost" value={state.data.transferCostFormatted} />
        </dl>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  large,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="rounded-control border border-line bg-surface-inset p-4">
      <dt className="text-xs text-content-tertiary">{label}</dt>
      <dd
        className={
          large
            ? "mt-1 hs-display text-2xl tabular-nums text-content"
            : "mt-1 font-mono text-lg text-content"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function toGwei(wei: string): string {
  const gwei = Number(wei) / 1e9;
  return gwei >= 1 ? gwei.toFixed(2).replace(/\.?0+$/, "") : gwei.toPrecision(2);
}
