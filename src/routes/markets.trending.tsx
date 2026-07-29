import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { PageContainer } from "@/components/layout/AppShell";
import { TableSkeleton } from "@/components/common/Skeletons";
import { GmgnErrorState } from "@/features/markets/GmgnErrorState";
import { RobinhoodMarketsPage } from "@/features/markets/RobinhoodMarketsPage";
import { TrendingTable } from "@/features/markets/TrendingTable";
import { TokenDetailDrawer } from "@/features/markets/TokenDetailDrawer";
import { matchesRobinhoodSearch } from "@/features/markets/search";
import {
  applyMarketFilters,
  DEFAULT_MARKET_FILTERS,
  type MarketFilterState,
} from "@/config/marketFilters";
import { gmgnTrendingQuery } from "@/lib/market/client";
import type { RobinhoodTrendingToken } from "@/types/gmgn";

const AUTO_REFRESH_MS = 30_000;

const searchSchema = z.object({
  interval: z.enum(["1m", "5m", "1h", "6h", "24h"]).catch("1h").default("1h"),
});

export const Route = createFileRoute("/markets/trending")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Robinhood Mainnet Trending — RobinPulse" },
      {
        name: "description",
        content: "Real-time Robinhood Mainnet trending tokens, ranked by market and swap activity.",
      },
    ],
  }),
  component: TrendingPage,
});

function TrendingPage() {
  const { interval } = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = useQuery(gmgnTrendingQuery(interval, 100));

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MarketFilterState>(DEFAULT_MARKET_FILTERS);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selected, setSelected] = useState<RobinhoodTrendingToken | null>(null);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => query.refetch(), AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, interval]);

  const rows = useMemo(() => {
    const data = query.data?.data ?? [];
    const bySearch = data.filter((token) => matchesRobinhoodSearch(token, search));
    return applyMarketFilters(bySearch, filters);
  }, [query.data, search, filters]);

  return (
    <PageContainer>
      <RobinhoodMarketsPage
        tab="trending"
        interval={interval}
        onIntervalChange={(next) => navigate({ search: { interval: next } })}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        onRefresh={() => query.refetch()}
        isFetching={query.isFetching}
        status={query.data ? { fetchedAt: query.data.fetchedAt, stale: query.data.stale } : null}
      >
        {query.isPending ? (
          <TableSkeleton columns={13} />
        ) : query.isError ? (
          <GmgnErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : (
          <TrendingTable tokens={rows} interval={interval} onOpenToken={setSelected} />
        )}
      </RobinhoodMarketsPage>
      <TokenDetailDrawer
        token={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </PageContainer>
  );
}
