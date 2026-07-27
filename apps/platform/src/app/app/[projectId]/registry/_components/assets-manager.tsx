"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useNetwork } from "@/components/network/network-provider";
import { Button, StatusBadge } from "@/components/ui";

import { addAssetAction, removeAssetAction } from "../actions";

export type AssetView = {
  id: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  source: string;
  network: string;
};

/**
 * The asset registry manager. Registering an asset reads and verifies its ERC-20
 * metadata on the chosen network, then stores it with the source. Entries are
 * keyed by chain and address, so the same token on two networks is two entries.
 */
export function AssetsManager({
  projectId,
  assets,
}: {
  projectId: string;
  assets: AssetView[];
}) {
  const router = useRouter();
  const { network: environment } = useNetwork();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add(formData: FormData) {
    setError(null);
    const address = String(formData.get("address") ?? "");
    const source = String(formData.get("source") ?? "");
    startTransition(async () => {
      const result = await addAssetAction({ projectId, environment, address, source });
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function remove(assetId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeAssetAction({ projectId, assetId });
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  const inputClass =
    "h-9 rounded-control border border-line-strong bg-surface px-3 text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50";

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-content-secondary">
        Verify a token on chain and record it with its source. Entries are keyed by
        network, so a token is verified on whichever network is selected in the header.
      </p>

      <form action={add} className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <input
          name="address"
          placeholder="Token contract address 0x…"
          disabled={pending}
          className={`${inputClass} flex-1 font-mono`}
          spellCheck={false}
        />
        <input
          name="source"
          placeholder="Source (URL or note)"
          maxLength={200}
          disabled={pending}
          className={`${inputClass} sm:w-56`}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Verifying" : "Verify and add"}
        </Button>
      </form>

      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      {assets.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center">
          <p className="text-sm font-medium text-content">No assets registered</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-content-secondary">
            Add a token address above. HoodStack reads its metadata from chain and stores
            it here with the source you record.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {assets.map((asset) => (
            <li key={asset.id} className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-content">{asset.name}</span>
                    <StatusBadge tone="info">{asset.symbol}</StatusBadge>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-content-tertiary" title={asset.address}>
                    {asset.address}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(asset.id)}
                  disabled={pending}
                  className="shrink-0 text-xs text-content-tertiary transition-colors hover:text-status-danger disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-3 text-xs">
                <div className="flex gap-1.5">
                  <dt className="text-content-tertiary">Network</dt>
                  <dd className="text-content">{asset.network}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-content-tertiary">Decimals</dt>
                  <dd className="text-content">{asset.decimals}</dd>
                </div>
                <div className="flex min-w-0 gap-1.5">
                  <dt className="shrink-0 text-content-tertiary">Source</dt>
                  <dd className="truncate text-content" title={asset.source}>
                    {asset.source}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
