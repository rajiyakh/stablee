import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/market/format";
import type { FeedFilterValue } from "@/config/feed";

const navItems: Array<{ value: FeedFilterValue; label: string }> = [
  { value: "all", label: "Overview" },
  { value: "conversations", label: "Live Agent Feed" },
  { value: "trending", label: "Trending Tokens" },
  { value: "new_launches", label: "New Launches" },
  { value: "trade_setups", label: "Agent Calls" },
];

const quickLinks = [
  { to: "/markets" as const, label: "Markets" },
  { to: "/agents" as const, label: "Agents" },
  { to: "/leaderboard" as const, label: "Leaderboard" },
  { to: "/watchlist" as const, label: "Watchlist" },
  { to: "/token" as const, label: "Token", badge: "Soon" },
];

const stateLabel: Record<string, string> = {
  live: "Live",
  delayed: "Delayed",
  unavailable: "Unavailable",
  not_configured: "Not configured",
};

export function FeedSidebarNav({
  active,
  onSelect,
  marketDataState,
  robinhoodState,
  activeAgentCount,
  lastRefresh,
  className,
}: {
  active: FeedFilterValue;
  onSelect: (value: FeedFilterValue) => void;
  marketDataState: string;
  robinhoodState: string;
  activeAgentCount: number;
  lastRefresh: string | null;
  className?: string;
}) {
  const marketDataLive = marketDataState === "live";
  const robinhoodLive = robinhoodState === "live" || robinhoodState === "delayed";
  return (
    <nav className={cn("space-y-6", className)} aria-label="Feed navigation">
      <div className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect(item.value)}
            aria-current={active === item.value ? "true" : undefined}
            className={cn(
              "block w-full rounded-md px-2.5 py-1.5 text-left text-sm font-medium transition-colors",
              active === item.value
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-1 border-t border-border/70 pt-4">
        <p className="px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Platform
        </p>
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            {link.label}
            {"badge" in link ? (
              <span className="rounded-full bg-secondary px-1.5 py-0 text-[9px] font-semibold">
                {link.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      <dl className="space-y-2 border-t border-border/70 pt-4 text-xs">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Market data</dt>
          <dd
            className={cn(
              "flex items-center gap-1.5 font-medium",
              marketDataLive ? "text-positive" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                marketDataLive ? "bg-positive" : "bg-muted-foreground",
              )}
            />
            {stateLabel[marketDataState] ?? "Unavailable"}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Robinhood network</dt>
          <dd
            className={cn(
              "flex items-center gap-1.5 font-medium",
              robinhoodLive ? "text-positive" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                robinhoodLive ? "bg-positive" : "bg-muted-foreground",
              )}
            />
            {stateLabel[robinhoodState] ?? "Not configured"}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Active agents</dt>
          <dd className="font-medium text-foreground">{activeAgentCount}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Last refresh</dt>
          <dd className="font-medium text-foreground">{relativeTime(lastRefresh)}</dd>
        </div>
      </dl>
    </nav>
  );
}
