"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { KeyEnvironment } from "@/lib/api-keys";
import { NETWORK_COOKIE } from "@/lib/network";

/**
 * Holds the selected network for the authenticated app and keeps it in sync
 * across the client tree, the persisting cookie, and the server components that
 * read it. `initial` comes from the cookie on the server so first paint matches.
 */

type NetworkContextValue = {
  network: KeyEnvironment;
  setNetwork: (next: KeyEnvironment) => void;
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({
  initial,
  children,
}: {
  initial: KeyEnvironment;
  children: ReactNode;
}) {
  const [network, setNetworkState] = useState<KeyEnvironment>(initial);
  const router = useRouter();

  const setNetwork = useCallback(
    (next: KeyEnvironment) => {
      if (next === network) return;
      setNetworkState(next);
      // Persist for a year; the server shell reads this on the next render.
      document.cookie = `${NETWORK_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      // Re-run server components (the shell badge and any server-read network
      // content) so the whole app aligns to the new network at once.
      router.refresh();
    },
    [network, router],
  );

  const value = useMemo(() => ({ network, setNetwork }), [network, setNetwork]);

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within a NetworkProvider.");
  return ctx;
}
