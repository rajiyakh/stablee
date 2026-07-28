import { queryOptions } from "@tanstack/react-query";
import { feedConfig } from "@/config/feed";
import type { FeedSnapshot, NewLaunchInfo } from "./types";

export class FeedApiError extends Error {}

async function fetchSnapshot(): Promise<FeedSnapshot> {
  const res = await fetch("/api/feed/snapshot", { headers: { accept: "application/json" } });
  const body = (await res.json()) as {
    data: FeedSnapshot | null;
    error: { message: string } | null;
  };
  if (!res.ok || body.error || !body.data) {
    throw new FeedApiError(body.error?.message ?? "The feed is temporarily unavailable.");
  }
  return body.data;
}

export const feedSnapshotQuery = () =>
  queryOptions({
    queryKey: ["feed", "snapshot"] as const,
    queryFn: fetchSnapshot,
    staleTime: feedConfig.refreshMs.conversationFeed,
    refetchInterval: feedConfig.refreshMs.conversationFeed,
  });

async function fetchNewLaunches(): Promise<NewLaunchInfo[]> {
  const res = await fetch("/api/feed/new-launches", { headers: { accept: "application/json" } });
  const body = (await res.json()) as {
    data: NewLaunchInfo[] | null;
    error: { message: string } | null;
  };
  if (!res.ok || body.error || !body.data) {
    throw new FeedApiError(body.error?.message ?? "New launches are temporarily unavailable.");
  }
  return body.data;
}

/** Site-wide (header ticker) — deliberately its own lightweight query, not a slice of feedSnapshotQuery. */
export const newLaunchesQuery = () =>
  queryOptions({
    queryKey: ["feed", "new-launches"] as const,
    queryFn: fetchNewLaunches,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
