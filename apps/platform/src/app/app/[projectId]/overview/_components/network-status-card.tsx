"use client";

import { useCallback, useEffect, useState } from "react";

import { useNetwork } from "@/components/network/network-provider";
import { Skeleton, cx } from "@/components/ui";

import { getNetworkStatusAction, type NetworkStatus } from "../actions";

type State =
  | { status: "loading" }
  | { status: "success"; data: NetworkStatus }
  | { status: "error"; error: string };

/**
 * Live network status, with real loading, success, and failure states.
 *
 * On mount (and on manual refresh) it fetches the latest block for the project's
 * network through a server action. While in flight it shows a shimmering
 * skeleton; on success the block and chain; on failure a message and a retry.
 * This is real data, so the states are the genuine article, not a demo.
 */
export function NetworkStatusCard({ projectId }: { projectId: string }) {
  const { network: environment } = useNetwork();
  const isTestnet = environment === "test";
  const [state, setState] = useState<State>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      else setState({ status: "loading" });
      const result = await getNetworkStatusAction({ projectId, environment });
      setState(
        result.ok
          ? { status: "success", data: result.data }
          : { status: "error", error: result.error },
      );
      if (manual) setRefreshing(false);
    },
    [projectId, environment],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-surface p-6">
      {/* Ambient glow. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--hs-text-brand) 16%, transparent), transparent)",
        }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            {state.status === "success" ? (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-content-brand opacity-60" />
            ) : null}
            <span
              className={cx(
                "relative inline-flex size-2 rounded-full",
                state.status === "success"
                  ? "bg-content-brand"
                  : state.status === "error"
                    ? "bg-status-danger"
                    : "bg-content-tertiary",
              )}
            />
          </span>
          <h2 className="hs-mono-label">Network</h2>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={state.status === "loading" || refreshing}
          className="text-xs text-content-tertiary transition-colors hover:text-content disabled:opacity-50"
        >
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {state.status === "loading" ? (
        <div className="mt-5 space-y-4">
          <Skeleton className="h-10 w-40" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="mt-5">
          <p className="text-sm text-status-danger">{state.error}</p>
          <button
            type="button"
            onClick={() => load(true)}
            className="mt-3 text-sm font-medium text-content-brand hover:underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      {state.status === "success" ? (
        <div className="mt-5">
          <div className="flex items-baseline gap-2">
            <span className="hs-display text-4xl tabular-nums text-content">
              #{state.data.blockNumber.toLocaleString()}
            </span>
            <span className="text-sm text-content-tertiary">latest block</span>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Chain" value={isTestnet ? "Testnet" : "Mainnet"} />
            <Stat label="Chain ID" value={String(state.data.chainId)} />
            <Stat label="Txns in block" value={String(state.data.transactionCount)} />
          </dl>
          <p className="mt-4 text-xs text-content-tertiary">
            Block time {timeAgo(state.data.timestamp)} · {state.data.chainName}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-line bg-surface-inset px-3 py-2">
      <dt className="text-xs text-content-tertiary">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm text-content">{value}</dd>
    </div>
  );
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}
