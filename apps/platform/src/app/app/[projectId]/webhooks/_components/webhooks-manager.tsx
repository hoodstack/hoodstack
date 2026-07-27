"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { DeliveryResult } from "@/server/webhooks";
import { Button, StatusBadge } from "@/components/ui";

import { addWebhookAction, removeWebhookAction, testWebhookAction } from "../actions";

export type EndpointView = {
  id: string;
  url: string;
  secret: string;
};

/**
 * Webhook endpoint manager: add an HTTPS endpoint, reveal its signing secret,
 * and send a signed test event to confirm the receiver verifies and responds.
 */
export function WebhooksManager({
  projectId,
  endpoints,
}: {
  projectId: string;
  endpoints: EndpointView[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add(formData: FormData) {
    setError(null);
    const url = String(formData.get("url") ?? "");
    startTransition(async () => {
      const result = await addWebhookAction({ projectId, url });
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeWebhookAction({ projectId, id });
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={add} className="flex flex-col gap-3 sm:flex-row">
        <input
          name="url"
          placeholder="https://your-app.com/webhooks/hoodstack"
          disabled={pending}
          spellCheck={false}
          className="h-9 flex-1 rounded-control border border-line-strong bg-surface px-3 font-mono text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Adding" : "Add endpoint"}
        </Button>
      </form>

      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      {endpoints.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center">
          <p className="text-sm font-medium text-content">No endpoints yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-content-secondary">
            Add a public HTTPS URL. HoodStack signs every delivery, so you can verify it
            came from us.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {endpoints.map((endpoint) => (
            <EndpointRow
              key={endpoint.id}
              endpoint={endpoint}
              projectId={projectId}
              onRemove={() => remove(endpoint.id)}
              busy={pending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function EndpointRow({
  endpoint,
  projectId,
  onRemove,
  busy,
}: {
  endpoint: EndpointView;
  projectId: string;
  onRemove: () => void;
  busy: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testing, startTest] = useTransition();
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  function test() {
    setResult(null);
    setTestError(null);
    startTest(async () => {
      const outcome = await testWebhookAction({ projectId, id: endpoint.id });
      if (outcome.ok) setResult(outcome.data);
      else setTestError(outcome.error);
    });
  }

  async function copySecret() {
    await navigator.clipboard.writeText(endpoint.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <li className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 break-all font-mono text-sm text-content">{endpoint.url}</p>
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          className="shrink-0 text-xs text-content-tertiary transition-colors hover:text-status-danger disabled:opacity-50"
        >
          Remove
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <span className="text-xs text-content-tertiary">Signing secret</span>
        <code className="rounded-control bg-canvas px-2 py-1 font-mono text-xs text-content">
          {revealed ? endpoint.secret : `whsec_${"•".repeat(10)}`}
        </code>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="text-xs text-content-tertiary hover:text-content"
        >
          {revealed ? "Hide" : "Reveal"}
        </button>
        {revealed ? (
          <button
            type="button"
            onClick={copySecret}
            className="text-xs text-content-tertiary hover:text-content"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={test} disabled={testing || busy}>
          {testing ? "Sending" : "Send test event"}
        </Button>
        {result ? (
          <span className="flex items-center gap-2 text-sm">
            <StatusBadge tone={result.ok ? "success" : "danger"}>
              {result.ok ? `Delivered ${result.status}` : "Failed"}
            </StatusBadge>
            <span className="text-content-tertiary">{result.latencyMs}ms</span>
            {result.error ? (
              <span className="text-content-tertiary">{result.error}</span>
            ) : null}
          </span>
        ) : null}
        {testError ? <span className="text-sm text-status-danger">{testError}</span> : null}
      </div>
    </li>
  );
}
