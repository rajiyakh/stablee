import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { CardSkeleton } from "@/components/common/Skeletons";
import { AgentMessageCard } from "./AgentMessageCard";
import { RiskAlertCard } from "./RiskAlertCard";
import { NewLaunchAlert } from "./NewLaunchAlert";
import { FeedFilters, FeedSortMenu } from "./FeedFilters";
import { feedConfig, type FeedFilterValue, type FeedSortValue } from "@/config/feed";
import type { AgentMessage, FeedSnapshot } from "@/lib/feed/types";

const riskSeverity: Record<AgentMessage["riskLevel"], number> = {
  low: 0,
  moderate: 1,
  high: 2,
  extreme: 3,
};

function filterMessages(
  messages: AgentMessage[],
  filter: FeedFilterValue,
  newLaunchKeys: Set<string>,
): AgentMessage[] {
  switch (filter) {
    case "conversations":
      return messages.filter((m) => !m.tradeSetup);
    case "trade_setups":
      return messages.filter((m) => Boolean(m.tradeSetup));
    case "risk_alerts":
      return messages.filter((m) => m.riskFlags.length > 0);
    case "new_launches":
      return messages.filter((m) =>
        newLaunchKeys.has(`${m.token.chainId}:${m.token.address.toLowerCase()}`),
      );
    case "bullish":
      return messages.filter((m) => m.stance === "bullish");
    case "bearish":
      return messages.filter((m) => m.stance === "bearish");
    case "high_confidence":
      return messages.filter((m) => m.confidence >= 0.65);
    case "low_liquidity":
      return messages.filter(
        (m) =>
          m.riskFlags.includes("low_liquidity") || m.riskFlags.includes("extremely_low_liquidity"),
      );
    case "trending":
    case "all":
    default:
      return messages;
  }
}

function sortMessages(messages: AgentMessage[], sort: FeedSortValue): AgentMessage[] {
  if (sort === "latest") return messages;
  const list = [...messages];
  if (sort === "highest_confidence") return list.sort((a, b) => b.confidence - a.confidence);
  if (sort === "highest_risk")
    return list.sort((a, b) => riskSeverity[b.riskLevel] - riskSeverity[a.riskLevel]);
  if (sort === "most_discussed" || sort === "highest_activity") {
    const counts = new Map<string, number>();
    for (const m of list) {
      const key = `${m.token.chainId}:${m.token.address.toLowerCase()}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return list.sort((a, b) => {
      const ka = `${a.token.chainId}:${a.token.address.toLowerCase()}`;
      const kb = `${b.token.chainId}:${b.token.address.toLowerCase()}`;
      return (counts.get(kb) ?? 0) - (counts.get(ka) ?? 0);
    });
  }
  return list;
}

export function AgentFeed({
  snapshot,
  isPending,
  isError,
  errorMessage,
  onRetry,
  onSelectThread,
  filter,
  onFilterChange,
}: {
  snapshot: FeedSnapshot | undefined;
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onSelectThread: (tokenKey: string) => void;
  filter: FeedFilterValue;
  onFilterChange: (value: FeedFilterValue) => void;
}) {
  const [sort, setSort] = useState<FeedSortValue>(feedConfig.defaultSort);
  const [visibleCount, setVisibleCount] = useState<number>(feedConfig.initialVisibleCount);

  const newLaunchKeys = useMemo(
    () =>
      new Set((snapshot?.newLaunches ?? []).map((l) => `${l.chainId}:${l.address.toLowerCase()}`)),
    [snapshot],
  );

  const filtered = useMemo(() => {
    if (!snapshot) return [];
    return sortMessages(filterMessages(snapshot.messages, filter, newLaunchKeys), sort);
  }, [snapshot, filter, sort, newLaunchKeys]);

  if (isPending) {
    return (
      <div className="space-y-4">
        <CardSkeleton count={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={errorMessage ?? "The feed is temporarily unavailable."}
        onRetry={onRetry}
      />
    );
  }

  if (!snapshot?.robinhoodConfigured) {
    return (
      <EmptyState
        title="Robinhood Mainnet live market data is not currently available from the configured providers."
        description="Set VITE_ROBINHOOD_DEXSCREENER_CHAIN_ID (and optionally GECKOTERMINAL_ROBINHOOD_NETWORK_ID) to activate the feed. See the Data sources page and each agent's methodology in the meantime."
      />
    );
  }

  const visible = filtered.slice(0, visibleCount);
  const newLaunchesInFilter = filter === "new_launches" ? snapshot.newLaunches : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FeedFilters active={filter} onChange={onFilterChange} />
        <FeedSortMenu value={sort} onChange={setSort} />
      </div>

      <div className="mt-4 space-y-3">
        {filter === "new_launches" ? (
          newLaunchesInFilter.length === 0 ? (
            <EmptyState
              title="No new launches detected"
              description="Nothing has met the configured new-launch thresholds yet."
            />
          ) : (
            newLaunchesInFilter.map((l) => (
              <NewLaunchAlert key={`${l.chainId}:${l.address}`} launch={l} />
            ))
          )
        ) : visible.length === 0 ? (
          <EmptyState
            title="No activity yet for this filter"
            description="The engine only publishes a message when a real threshold is crossed. Try a broader filter or check back shortly."
          />
        ) : (
          visible.map((message) =>
            filter === "risk_alerts" ? (
              <RiskAlertCard key={message.id} message={message} />
            ) : (
              <AgentMessageCard
                key={message.id}
                message={message}
                onOpenThread={() =>
                  onSelectThread(`${message.token.chainId}:${message.token.address.toLowerCase()}`)
                }
              />
            ),
          )
        )}

        {filter !== "new_launches" && visibleCount < filtered.length ? (
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVisibleCount((c) => c + feedConfig.loadMoreStep)}
            >
              Load older activity
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
