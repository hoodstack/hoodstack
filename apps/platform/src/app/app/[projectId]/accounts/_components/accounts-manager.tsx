"use client";

import type { AccountSummary } from "@hoodstack/network";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import type { KeyEnvironment } from "@/lib/api-keys";
import { useNetwork } from "@/components/network/network-provider";
import { Button, Skeleton, StatusBadge } from "@/components/ui";

import { addAccountAction, enrichAccountAction, removeAccountAction } from "../actions";

export type AccountView = {
  id: string;
  address: string;
  label: string;
};

/**
 * The account registry manager.
 *
 * Accounts come from the server (the source of truth); adding or removing calls
 * a server action and refreshes. Each row independently fetches its live
 * on-chain state on the selected network, with real loading, success, and error
 * states, so the registry is a monitoring surface, not a static list.
 */
export function AccountsManager({
  projectId,
  accounts,
}: {
  projectId: string;
  accounts: AccountView[];
}) {
  const router = useRouter();
  const { network: environment } = useNetwork();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add(formData: FormData) {
    setError(null);
    const address = String(formData.get("address") ?? "");
    const label = String(formData.get("label") ?? "");
    startTransition(async () => {
      const result = await addAccountAction({ projectId, address, label });
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function remove(accountId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeAccountAction({ projectId, accountId });
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-content-secondary">
        Track the accounts your app cares about and watch their live state on the
        network selected in the header.
      </p>

      <form action={add} className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <input
          name="address"
          placeholder="0x… address"
          spellCheck={false}
          disabled={pending}
          className="h-9 flex-1 rounded-control border border-line-strong bg-surface px-3 font-mono text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50"
        />
        <input
          name="label"
          placeholder="Label (optional)"
          maxLength={60}
          disabled={pending}
          className="h-9 rounded-control border border-line-strong bg-surface px-3 text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50 sm:w-48"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Working" : "Track account"}
        </Button>
      </form>

      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      {accounts.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center">
          <p className="text-sm font-medium text-content">No accounts tracked yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-content-secondary">
            Add an address above, a contract, a user wallet, or your treasury, and its
            balance, nonce, and type appear here live.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              projectId={projectId}
              environment={environment}
              onRemove={() => remove(account.id)}
              removing={pending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

type EnrichState =
  | { status: "loading" }
  | { status: "success"; data: AccountSummary }
  | { status: "error"; error: string };

function AccountRow({
  account,
  projectId,
  environment,
  onRemove,
  removing,
}: {
  account: AccountView;
  projectId: string;
  environment: KeyEnvironment;
  onRemove: () => void;
  removing: boolean;
}) {
  const [state, setState] = useState<EnrichState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = await enrichAccountAction({
      projectId,
      environment,
      address: account.address,
    });
    setState(
      result.ok
        ? { status: "success", data: result.data }
        : { status: "error", error: result.error },
    );
  }, [projectId, environment, account.address]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <li className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-content">{account.label}</p>
          <p className="truncate font-mono text-xs text-content-tertiary" title={account.address}>
            {account.address}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          aria-label="Stop tracking"
          className="shrink-0 text-xs text-content-tertiary transition-colors hover:text-status-danger disabled:opacity-50"
        >
          Remove
        </button>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        {state.status === "loading" ? (
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-status-danger">{state.error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="text-xs font-medium text-content-brand hover:underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {state.status === "success" ? (
          <dl className="grid grid-cols-3 gap-3">
            <Field label="Balance" value={state.data.balanceFormatted} />
            <Field label="Nonce" value={String(state.data.nonce)} />
            <Field
              label="Type"
              value={state.data.isContract ? "Contract" : "Wallet"}
              badge={state.data.isContract ? "info" : "neutral"}
            />
          </dl>
        ) : null}
      </div>
    </li>
  );
}

function Field({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: "info" | "neutral";
}) {
  return (
    <div>
      <dt className="text-xs text-content-tertiary">{label}</dt>
      <dd className="mt-1 text-sm text-content">
        {badge ? <StatusBadge tone={badge}>{value}</StatusBadge> : value}
      </dd>
    </div>
  );
}
