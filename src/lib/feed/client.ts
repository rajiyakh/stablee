import { queryOptions } from "@tanstack/react-query";
import { getEnvelope } from "@/lib/market/client";
import { feedConfig } from "@/config/feed";
import type {
  AgentMessage,
  ConsensusSummary,
  FeedSnapshot,
  MarketEvent,
  NewLaunchInfo,
  TokenRef,
} from "./types";

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

export interface ManualLookupPayload {
  token: TokenRef;
  event: MarketEvent;
  messages: AgentMessage[];
  consensus: ConsensusSummary;
  dataProvider: string;
}

/** On-demand — user pastes a contract address and asks for an agent read on it. See manualLookup.server.ts. */
export const manualLookupQuery = (chainId: string, address: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["feed", "manual-lookup", chainId, address] as const,
    queryFn: () =>
      getEnvelope<ManualLookupPayload>(
        `/api/feed/manual-lookup/${encodeURIComponent(chainId)}/${encodeURIComponent(address)}`,
      ),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
