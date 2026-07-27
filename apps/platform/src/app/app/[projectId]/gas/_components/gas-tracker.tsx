"use client";

import type { GasSummary } from "@hoodstack/network";
import { useCallback, useEffect, useState } from "react";

import type { KeyEnvironment } from "@/lib/api-keys";
import { Skeleton, cx } from "@/components/ui";

import { getGasAction } from "../actions";

type State =
  | { status: "loading" }
  | { status: "success"; data: GasSummary }
  | { status: "error"; error: string };

/** Live gas tracker with loading, success, and error states. */
export function GasTracker({ projectId }: { projectId: string }) {
  const [environment, setEnvironment] = useState<KeyEnvironment>("test");
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = await getGasAction({ projectId, environment });
    setState(
      result.ok
        ? { status: "success", data: result.data }
        : { status: "error", error: result.error },
    );
  }, [projectId, environment]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="rounded-card border border-line bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="hs-mono-label">Live gas</h2>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-control border border-line-strong p-0.5">
            {(["test", "live"] as const).map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => setEnvironment(env)}
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
          <button
            type="button"
            onClick={() => void load()}
            disabled={state.status === "loading"}
            className="text-xs text-content-tertiary transition-colors hover:text-content disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
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
