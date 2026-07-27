import { useCallback, useEffect, useState } from "react";

/** Persisted watchlist entry. Only identifiers are stored — never market values. */
export interface WatchEntry {
  key: string;
  kind: "coin" | "dex";
  id: string;
  chainId?: string;
  address?: string;
  symbol: string;
  name: string;
  addedAt: string;
}

const STORAGE_KEY = "robinpulse.watchlist.v1";
const EVENT = "robinpulse:watchlist";

function read(): WatchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as WatchEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: WatchEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function watchKey(input: Pick<WatchEntry, "kind" | "id" | "chainId" | "address">) {
  return input.kind === "coin"
    ? `coin:${input.id}`
    : `dex:${input.chainId ?? ""}:${(input.address ?? input.id).toLowerCase()}`;
}

export function useWatchlist() {
  const [entries, setEntries] = useState<WatchEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(read());
    setHydrated(true);
    const sync = () => setEntries(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((entry: Omit<WatchEntry, "key" | "addedAt">) => {
    const key = watchKey(entry);
    const current = read();
    const next = current.some((e) => e.key === key)
      ? current.filter((e) => e.key !== key)
      : [...current, { ...entry, key, addedAt: new Date().toISOString() }];
    write(next);
  }, []);

  const remove = useCallback((key: string) => {
    write(read().filter((e) => e.key !== key));
  }, []);

  const clear = useCallback(() => write([]), []);

  const has = useCallback((key: string) => entries.some((e) => e.key === key), [entries]);

  return { entries, hydrated, toggle, remove, clear, has };
}
