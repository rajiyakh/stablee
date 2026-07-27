import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PanelsTopLeft } from "lucide-react";
import { PageContainer } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { AgentFeed } from "@/components/feed/AgentFeed";
import { FeedSidebarNav } from "@/components/feed/FeedSidebarNav";
import { TrendingTokenPanel } from "@/components/feed/TrendingTokenPanel";
import { NewLaunchPanel } from "@/components/feed/NewLaunchPanel";
import { AgentConsensusCard } from "@/components/feed/AgentConsensusCard";
import { ThreadView } from "@/components/feed/ThreadView";
import { feedSnapshotQuery } from "@/lib/feed/client";
import { statusQuery } from "@/lib/market/client";
import { feedConfig, type FeedFilterValue } from "@/config/feed";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RobinPulse AI — Robinhood Mainnet Intelligence Feed" },
      {
        name: "description",
        content:
          "Independent AI agents analyzing live Robinhood Mainnet token activity, liquidity, momentum, risk, and market structure in real time.",
      },
      { property: "og:title", content: "RobinPulse AI — Robinhood Mainnet Intelligence Feed" },
      {
        property: "og:description",
        content:
          "Live agent conversations, trade setups, and risk alerts built from real, provider-backed data.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const status = useQuery(statusQuery());
  const feed = useQuery({ ...feedSnapshotQuery(), refetchIntervalInBackground: false });
  const [filter, setFilter] = useState<FeedFilterValue>(feedConfig.defaultFilter);
  const [selectedThreadKey, setSelectedThreadKey] = useState<string | null>(null);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);

  const snapshot = feed.data;

  const stateRank: Record<string, number> = {
    live: 3,
    delayed: 2,
    unavailable: 1,
    not_configured: 0,
  };
  const bestState = (ids: string[]): string =>
    (status.data?.providers ?? [])
      .filter((p) => ids.includes(p.id))
      .reduce<string>(
        (best, p) => ((stateRank[p.state] ?? 0) > (stateRank[best] ?? -1) ? p.state : best),
        "not_configured",
      );

  const marketDataState = bestState(["coingecko", "dexscreener"]);
  const robinhoodState = bestState(["robinhood"]);

  const selectedThread = useMemo(
    () => snapshot?.threads.find((t) => t.id === selectedThreadKey) ?? null,
    [snapshot, selectedThreadKey],
  );
  const selectedConsensus = selectedThreadKey
    ? (snapshot?.consensusByToken[selectedThreadKey] ?? null)
    : null;

  const topConsensus = useMemo(
    () =>
      Object.values(snapshot?.consensusByToken ?? {})
        .filter((c) => c.label !== "insufficient_data" && c.label !== "neutral")
        .slice(0, 3),
    [snapshot],
  );

  const sidebarProps = {
    active: filter,
    onSelect: (v: FeedFilterValue) => {
      setFilter(v);
      setMobileInfoOpen(false);
    },
    marketDataState,
    robinhoodState,
    activeAgentCount: snapshot?.activeAgentCount ?? 0,
    lastRefresh: snapshot?.generatedAt ?? null,
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <div>
          <h1 className="font-serif text-xl tracking-tight text-foreground">
            Robinhood Mainnet Intelligence Feed
          </h1>
          <p className="text-xs text-muted-foreground">
            Independent AI agents analyzing live token activity.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setMobileInfoOpen(true)}>
          <PanelsTopLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Filters & Info
        </Button>
      </div>

      <div className="hidden lg:block">
        <h1 className="font-serif text-2xl tracking-tight text-foreground">
          Robinhood Mainnet Intelligence Feed
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Independent AI agents analyzing live token activity, liquidity, momentum, risk, and market
          structure.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:items-start">
        <aside className="hidden lg:block lg:sticky lg:top-20">
          <FeedSidebarNav {...sidebarProps} />
        </aside>

        <main>
          <AgentFeed
            snapshot={snapshot}
            isPending={feed.isPending}
            isError={feed.isError}
            errorMessage={(feed.error as Error | undefined)?.message}
            onRetry={() => feed.refetch()}
            onSelectThread={setSelectedThreadKey}
          />
        </main>

        <aside className="hidden space-y-6 lg:sticky lg:top-20 lg:block">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Top Trending Tokens
            </h2>
            <div className="mt-2 rounded-xl border border-border bg-card p-3">
              <TrendingTokenPanel tokens={snapshot?.trendingTokens ?? []} />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Newly Launched Tokens
            </h2>
            <div className="mt-2">
              <NewLaunchPanel launches={snapshot?.newLaunches ?? []} />
            </div>
          </section>

          {topConsensus.length > 0 ? (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Highest AI Consensus
              </h2>
              <div className="mt-2 space-y-2">
                {topConsensus.map((c) => (
                  <AgentConsensusCard key={`${c.token.chainId}:${c.token.address}`} consensus={c} />
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      <Drawer open={mobileInfoOpen} onOpenChange={setMobileInfoOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerTitle className="px-4 pt-4 text-sm font-semibold">Feed navigation</DrawerTitle>
          <div className="space-y-6 overflow-y-auto px-4 pb-6 pt-4">
            <FeedSidebarNav {...sidebarProps} />
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Top Trending Tokens
              </h2>
              <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto pb-1 pl-1">
                {(snapshot?.trendingTokens ?? []).slice(0, 10).map((t) => (
                  <div
                    key={`${t.chainId}:${t.address}`}
                    className="w-28 shrink-0 rounded-lg border border-border/70 p-2 text-xs"
                  >
                    <p className="font-semibold text-foreground">{t.symbol}</p>
                    <p className="text-muted-foreground">#{t.rank}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <ThreadView
        thread={selectedThread}
        messages={snapshot?.messages ?? []}
        consensus={selectedConsensus}
        onOpenChange={(open) => !open && setSelectedThreadKey(null)}
      />
    </PageContainer>
  );
}
