"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui";

import { createProjectAction } from "../actions";

/**
 * Inline "new project" form.
 *
 * Submits to the server action and surfaces its error inline. A pending
 * transition disables the control so a double-submit can't create two projects.
 */
export function CreateProjectForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createProjectAction(formData);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <label htmlFor="project-name" className="sr-only">
          Project name
        </label>
        <input
          id="project-name"
          name="name"
          type="text"
          required
          maxLength={80}
          placeholder="e.g. Production API"
          disabled={pending}
          className="h-9 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50"
        />
        {error ? <p className="mt-2 text-sm text-status-danger">{error}</p> : null}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create project"}
      </Button>
    </form>
  );
}
