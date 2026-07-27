import { useCallback, useEffect, useState } from "react";

/** Followed token — only identifiers are stored, never market values. */
export interface FollowedToken {
  key: string;
  chainId: string;
  address: string;
  symbol: string;
  name: string;
  addedAt: string;
}

export interface BookmarkedThread {
  key: string;
  threadId: string;
  symbol: string;
  addedAt: string;
}

const TOKENS_KEY = "robinpulse.followedTokens.v1";
const AGENTS_KEY = "robinpulse.followedAgents.v1";
const BOOKMARKS_KEY = "robinpulse.bookmarkedThreads.v1";
const EVENT = "robinpulse:followed";

function readList<T>(storageKey: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as T[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList<T>(storageKey: string, entries: T[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function tokenKey(chainId: string, address: string): string {
  return `${chainId}:${address.toLowerCase()}`;
}

function useLocalStorageSet<T extends { key: string }>(storageKey: string) {
  const [entries, setEntries] = useState<T[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(readList<T>(storageKey));
    setHydrated(true);
    const sync = () => setEntries(readList<T>(storageKey));
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [storageKey]);

  const toggle = useCallback(
    (entry: T) => {
      const current = readList<T>(storageKey);
      const next = current.some((e) => e.key === entry.key)
        ? current.filter((e) => e.key !== entry.key)
        : [...current, entry];
      writeList(storageKey, next);
    },
    [storageKey],
  );

  const remove = useCallback(
    (key: string) =>
      writeList(
        storageKey,
        readList<T>(storageKey).filter((e) => e.key !== key),
      ),
    [storageKey],
  );

  const clear = useCallback(() => writeList<T>(storageKey, []), [storageKey]);
  const has = useCallback((key: string) => entries.some((e) => e.key === key), [entries]);

  return { entries, hydrated, toggle, remove, clear, has };
}

export function useFollowedTokens() {
  return useLocalStorageSet<FollowedToken>(TOKENS_KEY);
}

export function useFollowedAgents() {
  return useLocalStorageSet<{ key: string; slug: string; addedAt: string }>(AGENTS_KEY);
}

export function useBookmarkedThreads() {
  return useLocalStorageSet<BookmarkedThread>(BOOKMARKS_KEY);
}
