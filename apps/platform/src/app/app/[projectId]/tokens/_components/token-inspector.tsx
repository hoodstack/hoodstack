"use client";

import type { TokenSummary } from "@hoodstack/network";
import { useState, useTransition } from "react";

import type { KeyEnvironment } from "@/lib/api-keys";
import { Button, DefinitionRow, StatusBadge, cx } from "@/components/ui";

import { getTokenAction } from "../actions";

/** Live ERC-20 inspector with loading, success, and error states. */
export function TokenInspector({ projectId }: { projectId: string }) {
  const [environment, setEnvironment] = useState<KeyEnvironment>("test");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<TokenSummary | null>(null);

  function inspect(formData: FormData) {
    setError(null);
    setToken(null);
    const address = String(formData.get("address") ?? "").trim();
    if (!address) return setError("Enter a token contract address.");
    const holder = String(formData.get("holder") ?? "");
    startTransition(async () => {
      const result = await getTokenAction({ projectId, environment, address, holder });
      if (result.ok) setToken(result.data);
      else setError(result.error);
    });
  }

  const inputClass =
    "h-9 w-full rounded-control border border-line-strong bg-surface px-3 font-mono text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50";

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
                setToken(null);
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

      <form action={inspect} className="flex flex-col gap-3">
        <input name="address" placeholder="Token contract address 0x…" disabled={pending} className={inputClass} spellCheck={false} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <input name="holder" placeholder="Holder address for balance (optional)" disabled={pending} className={inputClass} spellCheck={false} />
          <Button type="submit" disabled={pending}>
            {pending ? "Reading" : "Inspect"}
          </Button>
        </div>
      </form>

      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      {token ? (
        <div className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-content">{token.name}</span>
            <StatusBadge tone="info">{token.symbol}</StatusBadge>
          </div>
          <dl className="mt-4">
            <DefinitionRow term="Contract">
              <span className="font-mono text-xs break-all">{token.address}</span>
            </DefinitionRow>
            <DefinitionRow term="Decimals">{token.decimals}</DefinitionRow>
            <DefinitionRow term="Total supply">
              {token.totalSupplyFormatted} {token.symbol}
            </DefinitionRow>
            {token.holderBalanceFormatted !== null ? (
              <DefinitionRow term="Holder balance">
                {token.holderBalanceFormatted} {token.symbol}
              </DefinitionRow>
            ) : null}
            <DefinitionRow term="Chain ID">{token.chainId}</DefinitionRow>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
