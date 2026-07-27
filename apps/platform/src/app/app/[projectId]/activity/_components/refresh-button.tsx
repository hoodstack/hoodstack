"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui";

/** Re-fetches the server-rendered activity feed in place. */
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? "Refreshing" : "Refresh"}
    </Button>
  );
}
