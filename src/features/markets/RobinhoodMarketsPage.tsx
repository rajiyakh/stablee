import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SectionHeading } from "@/components/common/SectionHeading";
import { DataSourceNote } from "@/components/common/DataSourceNote";
import { IntervalSelector } from "./IntervalSelector";
import { MarketFilters } from "./MarketFilters";
import { cn } from "@/lib/utils";
import type { GmgnInterval } from "@/types/gmgn";
import type { MarketFilterState } from "@/config/marketFilters";

const COPY: Record<"trending" | "hot-searches", { title: string; description: string }> = {
  trending: {
    title: "Trending",
    description:
      "Trending ranks Robinhood Mainnet tokens using current market and swap activity. Rankings may change rapidly and do not represent an endorsement by RobinPulse AI.",
  },
  "hot-searches": {
    title: "Hot Searches",
    description:
      "Hot Searches ranks Robinhood Mainnet tokens by current search attention. High search activity does not necessarily mean strong liquidity, safety, or positive price performance.",
  },
};

const TABS: Array<{
  id: "trending" | "hot-searches" | "new-pairs" | "signals";
  label: string;
  to?: string;
}> = [
  { id: "trending", label: "Trending", to: "/markets/trending" },
  { id: "hot-searches", label: "Hot Searches", to: "/markets/hot-searches" },
  { id: "new-pairs", label: "New Pairs" },
  { id: "signals", label: "Signals" },
];

export function RobinhoodMarketsPage({
  tab,
  interval,
  onIntervalChange,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
  isFetching,
  status,
  children,
}: {
  tab: "trending" | "hot-searches";
  interval: GmgnInterval;
  onIntervalChange: (interval: GmgnInterval) => void;
  search: string;
  onSearchChange: (search: string) => void;
  filters: MarketFilterState;
  onFiltersChange: (filters: MarketFilterState) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  onRefresh: () => void;
  isFetching: boolean;
  status: { fetchedAt?: string | null; stale?: boolean } | null;
  children: ReactNode;
}) {
  const copy = COPY[tab];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Robinhood Mainnet"
        title={copy.title}
        description={copy.description}
      />

      <nav
        aria-label="Markets"
        className="flex flex-wrap items-center gap-1 border-b border-border"
      >
        {TABS.map((t) =>
          t.to ? (
            <Link
              key={t.id}
              to={t.to}
              search={{ interval }}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
                t.id === tab
                  ? "border-brand text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          ) : (
            <span
              key={t.id}
              className="-mb-px flex items-center gap-1 border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground/50"
            >
              {t.label}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                Soon
              </span>
            </span>
          ),
        )}
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, symbol, or contract address"
          className="h-9 w-full max-w-xs"
        />
        <IntervalSelector value={interval} onChange={onIntervalChange} />
        <MarketFilters scope={tab} filters={filters} onChange={onFiltersChange} />
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Switch checked={autoRefresh} onCheckedChange={onAutoRefreshChange} />
            Auto-refresh
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {children}

      {status ? (
        <div className="flex items-center gap-2">
          <DataSourceNote
            source="Robinhood Mainnet"
            fetchedAt={status.fetchedAt}
            stale={status.stale}
          />
          {status.stale ? (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              Delayed
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
