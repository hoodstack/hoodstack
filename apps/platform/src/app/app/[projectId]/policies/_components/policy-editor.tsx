"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatEther } from "viem";

import type { PolicyMode, ProjectPolicyView } from "@/server/policies";
import { Button, StatusBadge } from "@/components/ui";

import {
  addAllowlistAction,
  removeAllowlistAction,
  updatePolicyAction,
} from "../actions";

/**
 * Policy editor: a spending ceiling and a recipient allowlist. Saving upserts
 * the policy; the allowlist mutates through server actions and refreshes. These
 * rules are evaluated live in the Transactions simulator.
 */
export function PolicyEditor({
  projectId,
  policy,
}: {
  projectId: string;
  policy: ProjectPolicyView;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const initialMax = policy.maxValueWei ? formatEther(BigInt(policy.maxValueWei)) : "";

  function save(formData: FormData) {
    setError(null);
    setSaved(false);
    const maxValueEth = String(formData.get("maxValue") ?? "");
    const allowlistMode = String(formData.get("allowlistMode") ?? "off") as PolicyMode;
    startTransition(async () => {
      const result = await updatePolicyAction({ projectId, maxValueEth, allowlistMode });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function addAddress(formData: FormData) {
    setError(null);
    const address = String(formData.get("address") ?? "");
    startTransition(async () => {
      const result = await addAllowlistAction({ projectId, address });
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function removeAddress(entryId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeAllowlistAction({ projectId, entryId });
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  const inputClass =
    "h-9 rounded-control border border-line-strong bg-surface px-3 text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50";

  return (
    <div className="flex flex-col gap-6">
      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      {/* Rules. */}
      <div className="rounded-card border border-line bg-surface p-6">
        <h2 className="text-md font-medium text-content">Rules</h2>
        <p className="mt-1 text-sm text-content-secondary">
          Evaluated against every simulation in Transactions.
        </p>
        <form action={save} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-content">Maximum transaction value (ETH)</span>
            <input
              name="maxValue"
              defaultValue={initialMax}
              placeholder="No limit"
              disabled={pending}
              className={`${inputClass} sm:w-64`}
              spellCheck={false}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-content">Recipient allowlist</span>
            <select
              name="allowlistMode"
              defaultValue={policy.allowlistMode}
              disabled={pending}
              className={`${inputClass} sm:w-64`}
            >
              <option value="off">Off, allow any recipient</option>
              <option value="enforce">Enforce, allow only listed recipients</option>
            </select>
          </label>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving" : "Save rules"}
            </Button>
            {saved ? <span className="text-sm text-content-tertiary">Saved</span> : null}
          </div>
        </form>
      </div>

      {/* Allowlist. */}
      <div className="rounded-card border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-md font-medium text-content">Allowlist</h2>
          <StatusBadge tone={policy.allowlistMode === "enforce" ? "success" : "neutral"}>
            {policy.allowlistMode === "enforce" ? "Enforced" : "Not enforced"}
          </StatusBadge>
        </div>

        <form action={addAddress} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            name="address"
            placeholder="0x… recipient address"
            disabled={pending}
            className={`${inputClass} flex-1 font-mono`}
            spellCheck={false}
          />
          <Button type="submit" variant="secondary" disabled={pending}>
            Add
          </Button>
        </form>

        {policy.allowlist.length === 0 ? (
          <p className="mt-4 text-sm text-content-tertiary">No addresses yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-control border border-line">
            {policy.allowlist.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 bg-surface-inset px-3 py-2"
              >
                <span className="truncate font-mono text-xs text-content">
                  {entry.address}
                </span>
                <button
                  type="button"
                  onClick={() => removeAddress(entry.id)}
                  disabled={pending}
                  className="shrink-0 text-xs text-content-tertiary transition-colors hover:text-status-danger disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
