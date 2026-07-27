"use client";

import { useState, useTransition } from "react";

import { Button, StatusBadge } from "@/components/ui";

import { mintKeyAction, revokeKeyAction } from "../actions";

export type KeyView = {
  id: string;
  name: string;
  environment: "live" | "test";
  prefix: string;
  lastFour: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

/**
 * API key management for a project.
 *
 * Minting returns the plaintext exactly once; it is shown in a dismissible
 * reveal with a copy button and then is unrecoverable — thereafter only the
 * prefix and last four are ever displayed. Revoked keys stay listed (struck
 * through) so their past usage remains legible.
 */
export function ApiKeysPanel({
  projectId,
  keys,
}: {
  projectId: string;
  keys: KeyView[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [minted, setMinted] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function mint(formData: FormData) {
    setError(null);
    setMinted(null);
    const name = String(formData.get("name") ?? "");
    const environment = String(formData.get("environment") ?? "test") as "live" | "test";
    startTransition(async () => {
      const result = await mintKeyAction({ projectId, name, environment });
      if (result.ok) setMinted(result.data.plaintext);
      else setError(result.error);
    });
  }

  function revoke(keyId: string) {
    setError(null);
    startTransition(async () => {
      const result = await revokeKeyAction({ projectId, keyId });
      if (!result.ok) setError(result.error);
    });
  }

  async function copy() {
    if (!minted) return;
    await navigator.clipboard.writeText(minted);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* One-time reveal of a freshly minted key. */}
      {minted ? (
        <div className="rounded-card border border-line-brand bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-content">
              Copy your key now — it won't be shown again.
            </p>
            <button
              type="button"
              onClick={() => setMinted(null)}
              className="text-sm text-content-tertiary hover:text-content"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-control bg-canvas px-3 py-2 font-mono text-sm text-content">
              {minted}
            </code>
            <Button variant="secondary" onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Mint form. */}
      <form action={mint} className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <input
          name="name"
          type="text"
          maxLength={80}
          placeholder="Key name (e.g. server)"
          disabled={pending}
          className="h-9 flex-1 rounded-control border border-line-strong bg-surface px-3 text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50"
        />
        <select
          name="environment"
          defaultValue="test"
          disabled={pending}
          className="h-9 rounded-control border border-line-strong bg-surface px-3 text-sm text-content focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50"
        >
          <option value="test">Test</option>
          <option value="live">Live</option>
        </select>
        <Button type="submit" disabled={pending}>
          {pending ? "Working…" : "Create key"}
        </Button>
      </form>

      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      {/* Existing keys. */}
      {keys.length === 0 ? (
        <p className="text-sm text-content-secondary">No API keys yet.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line">
          {keys.map((key) => {
            const revoked = key.revokedAt !== null;
            return (
              <li
                key={key.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        revoked
                          ? "text-sm font-medium text-content-tertiary line-through"
                          : "text-sm font-medium text-content"
                      }
                    >
                      {key.name}
                    </span>
                    <StatusBadge tone={key.environment === "live" ? "success" : "neutral"}>
                      {key.environment}
                    </StatusBadge>
                    {revoked ? <StatusBadge tone="danger">revoked</StatusBadge> : null}
                  </div>
                  <p className="mt-1 font-mono text-xs text-content-tertiary">
                    {key.prefix}_…{key.lastFour}
                  </p>
                </div>
                {!revoked ? (
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() => revoke(key.id)}
                  >
                    Revoke
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
