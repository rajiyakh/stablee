import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "robinpulse_swap_history_v1_";
const MAX_ENTRIES = 50;

export interface SwapHistoryEntry {
  hash: string;
  timestamp: string;
  sellSymbol: string;
  sellAmount: string;
  buySymbol: string;
  buyAmount: string;
  status: "confirmed" | "reverted";
}

/** Pure — no storage access — so per-address scoping is unit-testable without a DOM/localStorage environment. */
export function storageKey(address: string): string {
  return `${STORAGE_PREFIX}${address.toLowerCase()}`;
}

/** Pure — prepends the new entry and caps the list, oldest entries falling off the end. */
export function capHistory(
  entries: SwapHistoryEntry[],
  newEntry: SwapHistoryEntry,
  max = MAX_ENTRIES,
): SwapHistoryEntry[] {
  return [newEntry, ...entries].slice(0, max);
}

function readHistory(address: string): SwapHistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(storageKey(address));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SwapHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

/**
 * Swap history for the connected wallet, made through RobinPulse only —
 * recorded client-side, at the moment SwapPage confirms a swap, since
 * that's the only point with first-hand certainty about what was swapped
 * (0x's settler address isn't fixed in this codebase, so there's no
 * reliable way to detect "was this on-chain tx a RobinPulse swap" from raw
 * chain data after the fact). localStorage, keyed per wallet address —
 * same client-only pattern as useTermsAcceptance.ts, including the
 * starts-false-until-mounted approach to avoid an SSR/hydration mismatch.
 */
export function useSwapHistory(address: string | undefined) {
  const [history, setHistory] = useState<SwapHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(address ? readHistory(address) : []);
  }, [address]);

  const addEntry = useCallback(
    (entry: SwapHistoryEntry) => {
      if (!address) return;
      setHistory((prev) => {
        const next = capHistory(prev, entry);
        try {
          window.localStorage.setItem(storageKey(address), JSON.stringify(next));
        } catch {
          // Best-effort persistence — the in-memory list still updates for this session.
        }
        return next;
      });
    },
    [address],
  );

  const clearHistory = useCallback(() => {
    if (!address) return;
    setHistory([]);
    try {
      window.localStorage.removeItem(storageKey(address));
    } catch {
      // Nothing further to do — in-memory state is already cleared.
    }
  }, [address]);

  return { history, addEntry, clearHistory };
}
