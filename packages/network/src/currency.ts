import { HoodStackError } from "@hoodstack/errors";
import { formatUnits, parseUnits } from "viem";

import type { HoodStackChain } from "./types.js";

export interface FormatNativeOptions {
  /** Maximum fractional digits to display. Defaults to 6. */
  readonly maxDecimals?: number;
  /** Append the currency symbol, e.g. `0.0123 ETH`. Defaults to `false`. */
  readonly withSymbol?: boolean;
}

/**
 * Formats a native-currency amount for display.
 *
 * Display only - never round-trip a formatted string back into an amount. Values
 * stay `bigint` wei everywhere else; formatting is lossy by design.
 *
 * A non-zero amount that would round to zero renders as `<0.000001` rather than
 * `0`, so dust is never shown as nothing.
 */
export function formatNative(
  wei: bigint,
  chain: HoodStackChain,
  options: FormatNativeOptions = {},
): string {
  const { maxDecimals = 6, withSymbol = false } = options;
  const symbol = chain.nativeCurrency.symbol;
  const exact = formatUnits(wei, chain.nativeCurrency.decimals);

  const suffix = withSymbol ? ` ${symbol}` : "";

  const [whole = "0", fraction = ""] = exact.split(".");
  const negative = whole.startsWith("-");

  if (fraction.length <= maxDecimals) {
    const trimmed = fraction.replace(/0+$/, "");
    return `${trimmed ? `${whole}.${trimmed}` : whole}${suffix}`;
  }

  const truncated = fraction.slice(0, maxDecimals).replace(/0+$/, "");

  // Truncation, not rounding: never display more value than is actually there.
  if (!truncated && wei !== 0n) {
    const epsilon = `0.${"0".repeat(maxDecimals - 1)}1`;
    return `${negative ? ">-" : "<"}${epsilon}${suffix}`;
  }

  return `${truncated ? `${whole}.${truncated}` : whole}${suffix}`;
}

/**
 * Parses a decimal native-currency string into wei.
 *
 * Rejects input with more precision than the currency supports instead of
 * silently truncating it - a dropped digit in an amount field is a fund-loss
 * bug, not a formatting detail.
 */
export function parseNative(value: string, chain: HoodStackChain): bigint {
  const trimmed = value.trim();
  const decimals = chain.nativeCurrency.decimals;

  if (!/^-?\d*(\.\d+)?$/.test(trimmed) || trimmed === "" || trimmed === "-") {
    throw new HoodStackError("HS_INVALID_PARAMETER", {
      message: `"${value}" is not a valid ${chain.nativeCurrency.symbol} amount.`,
      details: { received: value },
    });
  }

  const fraction = trimmed.split(".")[1] ?? "";
  if (fraction.length > decimals) {
    throw new HoodStackError("HS_INVALID_PARAMETER", {
      message:
        `"${value}" has ${fraction.length} decimal places but ` +
        `${chain.nativeCurrency.symbol} supports ${decimals}.`,
      details: { received: value, maxDecimals: decimals },
    });
  }

  return parseUnits(trimmed, decimals);
}
