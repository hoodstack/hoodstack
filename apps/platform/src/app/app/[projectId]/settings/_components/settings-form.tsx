"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui";

import { deleteProjectAction, renameProjectAction } from "../actions";

/**
 * Project settings: rename, and a guarded delete that requires typing the project
 * name to confirm. Delete cascades to the project's keys, usage, and policies.
 */
export function SettingsForm({
  projectId,
  projectName,
  projectSlug,
}: {
  projectId: string;
  projectName: string;
  projectSlug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState("");

  function rename(formData: FormData) {
    setError(null);
    setSaved(false);
    const name = String(formData.get("name") ?? "");
    startTransition(async () => {
      const result = await renameProjectAction({ projectId, name });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProjectAction({ projectId });
      // On success the action redirects; only a failure returns here.
      if (result && !result.ok) setError(result.error);
    });
  }

  const inputClass =
    "h-9 rounded-control border border-line-strong bg-surface px-3 text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50";

  return (
    <div className="flex flex-col gap-6">
      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      <div className="rounded-card border border-line bg-surface p-6">
        <h2 className="text-md font-medium text-content">Name</h2>
        <form action={rename} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            name="name"
            defaultValue={projectName}
            maxLength={80}
            disabled={pending}
            className={`${inputClass} sm:w-72`}
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving" : "Save"}
          </Button>
          {saved ? <span className="text-sm text-content-tertiary">Saved</span> : null}
        </form>
        <p className="mt-2 font-mono text-xs text-content-tertiary">{projectSlug}</p>
      </div>

      <div className="rounded-card border border-status-danger bg-surface p-6">
        <h2 className="text-md font-medium text-status-danger">Delete project</h2>
        <p className="mt-2 max-w-2xl text-sm text-content-secondary">
          This permanently deletes the project and everything scoped to it, its API
          keys, usage history, policies, accounts, and webhooks. This cannot be undone.
          Type <code className="font-mono text-content">{projectName}</code> to confirm.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={projectName}
            disabled={pending}
            className={`${inputClass} sm:w-72`}
          />
          <Button
            variant="secondary"
            disabled={pending || confirm !== projectName}
            onClick={remove}
            className="border-status-danger text-status-danger hover:border-status-danger hover:text-status-danger"
          >
            {pending ? "Deleting" : "Delete project"}
          </Button>
        </div>
      </div>
    </div>
  );
}
