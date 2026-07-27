"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";

/**
 * The signed-in account control: shows who you are and lets you sign out.
 *
 * `email` comes from the server session (authoritative), not from Privy client
 * state, so it renders correctly on first paint. Signing out clears Privy and
 * refreshes back to the signed-out gate.
 */
export function AccountMenu({ email }: { email: string | null }) {
  const { logout } = usePrivy();
  const router = useRouter();

  async function signOut() {
    await logout();
    router.replace("/app/projects");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      {email ? (
        <span className="hidden text-sm text-content-secondary sm:inline">{email}</span>
      ) : null}
      <Button variant="secondary" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
