"use client";

import { useMemo, useState, useTransition } from "react";

import type { KeyEnvironment } from "@/lib/api-keys";
import { Button, cx } from "@/components/ui";

import { runPlaygroundAction } from "../actions";

type Field = { name: string; placeholder: string };
type Endpoint = { id: string; label: string; method: string; path: string; fields: Field[] };

const ENDPOINTS: Endpoint[] = [
  { id: "account", label: "Account read", method: "GET", path: "/api/v1/data/account", fields: [{ name: "address", placeholder: "0x… address" }] },
  { id: "transaction", label: "Transaction read", method: "GET", path: "/api/v1/data/transaction", fields: [{ name: "hash", placeholder: "0x… tx hash" }] },
  { id: "block", label: "Block read", method: "GET", path: "/api/v1/data/block", fields: [{ name: "number", placeholder: "latest or a number" }] },
  { id: "token", label: "Token read", method: "GET", path: "/api/v1/data/token", fields: [{ name: "address", placeholder: "0x… token" }, { name: "holder", placeholder: "0x… holder (optional)" }] },
  { id: "gas", label: "Gas", method: "GET", path: "/api/v1/gas", fields: [] },
  { id: "simulate", label: "Simulate", method: "POST", path: "/api/v1/tx/simulate", fields: [{ name: "to", placeholder: "0x… recipient" }, { name: "valueWei", placeholder: "value in wei (optional)" }, { name: "data", placeholder: "calldata 0x… (optional)" }] },
];

/** An interactive console that runs the live read endpoints against testnet or mainnet. */
export function Playground({ projectId }: { projectId: string }) {
  const [endpointId, setEndpointId] = useState<string>("account");
  const [environment, setEnvironment] = useState<KeyEnvironment>("test");
  const [values, setValues] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);

  const endpoint = useMemo(
    () => ENDPOINTS.find((e) => e.id === endpointId)!,
    [endpointId],
  );

  function run() {
    setError(null);
    setResponse(null);
    const params: Record<string, string> = {};
    for (const field of endpoint.fields) {
      const v = values[`${endpointId}.${field.name}`];
      if (v) params[field.name] = v;
    }
    startTransition(async () => {
      const result = await runPlaygroundAction({ projectId, environment, endpoint: endpointId, params });
      if (result.ok) setResponse(JSON.stringify(result.data, null, 2));
      else setError(result.error);
    });
  }

  const inputClass =
    "h-9 w-full rounded-control border border-line-strong bg-surface px-3 font-mono text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={endpointId}
          onChange={(e) => {
            setEndpointId(e.target.value);
            setResponse(null);
            setError(null);
          }}
          disabled={pending}
          className="h-9 rounded-control border border-line-strong bg-surface px-3 text-sm text-content focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50"
        >
          {ENDPOINTS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.method} {e.path}
            </option>
          ))}
        </select>
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
      </div>

      {endpoint.fields.length > 0 ? (
        <div className="flex flex-col gap-3">
          {endpoint.fields.map((field) => (
            <input
              key={field.name}
              placeholder={field.placeholder}
              value={values[`${endpointId}.${field.name}`] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [`${endpointId}.${field.name}`]: e.target.value }))
              }
              disabled={pending}
              spellCheck={false}
              className={inputClass}
            />
          ))}
        </div>
      ) : null}

      <div>
        <Button onClick={run} disabled={pending}>
          {pending ? "Running" : "Run"}
        </Button>
      </div>

      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      {response ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface-inset">
          <div className="border-b border-line px-4 py-2">
            <span className="hs-mono-label">Response</span>
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
            <code className="font-mono text-content">{response}</code>
          </pre>
        </div>
      ) : null}
    </div>
  );
}
