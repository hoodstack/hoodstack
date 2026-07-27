"use client";

import type { KeyEnvironment } from "@/lib/api-keys";
import { cx } from "@/components/ui";

import { useNetwork } from "./network-provider";

/**
 * The global network control in the app header.
 *
 * One segmented switch governs the whole dashboard: every module reads the same
 * selection, so flipping it here re-aligns accounts, gas, data, explorer, and the
 * rest to the chosen network. Testnet reads as calm (info); mainnet reads as
 * consequential (warning), since it acts against real Robinhood Chain.
 */

const OPTIONS = [
  { value: "test", label: "Testnet", active: "bg-status-info-bg text-status-info", dot: "bg-status-info" },
  { value: "live", label: "Mainnet", active: "bg-status-warning-bg text-status-warning", dot: "bg-status-warning" },
] as const satisfies readonly { value: KeyEnvironment; label: string; active: string; dot: string }[];

export function NetworkSwitcher() {
  const { network, setNetwork } = useNetwork();

  return (
    <div
      role="radiogroup"
      aria-label="Network"
      className="inline-flex items-center rounded-control border border-line-strong p-0.5"
    >
      {OPTIONS.map((opt) => {
        const active = network === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={`Switch the whole app to ${opt.label}`}
            onClick={() => setNetwork(opt.value)}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-[calc(var(--hs-radius-control)-2px)] px-2 py-1 text-xs font-medium transition-colors duration-fast sm:px-2.5",
              active ? opt.active : "text-content-tertiary hover:text-content",
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                "size-1.5 rounded-pill transition-colors",
                active ? opt.dot : "bg-current opacity-40",
              )}
            />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
