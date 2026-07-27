import { queryOptions } from "@tanstack/react-query";
import { feedConfig } from "@/config/feed";
import type { FeedSnapshot } from "./types";

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
