import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChartLine, Coins, Star, TrendingUp, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/market/format";
import { statusQuery } from "@/lib/market/client";
import { feedSnapshotQuery } from "@/lib/feed/client";
import { deriveProviderStates } from "@/lib/feed/providerStatus";
import { feedConfig, feedFilters, type FeedFilterValue } from "@/config/feed";
import { GlobalSearch } from "./GlobalSearch";
import { SidebarToggle } from "./SiteHeader";

// Leaderboard and Data Sources are intentionally left out (still reachable
// directly at /leaderboard and /data) — hidden from nav, not deleted.
const secondaryItems = [
  { to: "/markets", label: "Markets", icon: ChartLine },
  { to: "/trending", label: "Robinhood Trends", icon: TrendingUp },
  { to: "/agents", label: "Agents", icon: Users },
  { to: "/watchlist", label: "Watchlist", icon: Star },
  { to: "/token", label: "Token", icon: Coins, badge: "Soon" },
] as const;

const stateLabel: Record<string, string> = {
  live: "Live",
  delayed: "Delayed",
  unavailable: "Unavailable",
  not_configured: "Not configured",
};

/**
 * The Overview page's feed filters + status block, merged into the sidebar
 * itself rather than living in a second column next to it. AppSidebar only
 * mounts this while on "/", so these queries never fire on other routes —
 * and while on "/", they share a cache entry (same queryKey) with the ones
 * Home itself runs, so this doesn't add a second network call.
 */
function OverviewFeedSection() {
  const navigate = useNavigate();
  const activeFilter = useRouterState({
    select: (s) =>
      (s.location.search as { filter?: FeedFilterValue }).filter ?? feedConfig.defaultFilter,
  });
  const status = useQuery(statusQuery());
  const feed = useQuery({ ...feedSnapshotQuery(), refetchIntervalInBackground: false });
  const { marketDataState, robinhoodState } = deriveProviderStates(status.data?.providers);
  const marketDataLive = marketDataState === "live";
  const robinhoodLive = robinhoodState === "live" || robinhoodState === "delayed";

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupContent>
          <SidebarMenu>
            {feedFilters
              .filter((f) =>
                ["all", "conversations", "trending", "new_launches", "trade_setups"].includes(
                  f.value,
                ),
              )
              .map((f) => (
                <SidebarMenuItem key={f.value}>
                  <SidebarMenuButton
                    isActive={activeFilter === f.value}
                    onClick={() => navigate({ to: "/", search: { filter: f.value } })}
                  >
                    <span>{f.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <div className="space-y-2 border-t border-sidebar-border px-4 py-3 text-xs group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Market data</span>
          <span
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
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Robinhood network</span>
          <span
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
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Active agents</span>
          <span className="font-medium text-foreground">{feed.data?.activeAgentCount ?? 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Last refresh</span>
          <span className="font-medium text-foreground">
            {relativeTime(feed.data?.generatedAt ?? null)}
          </span>
        </div>
      </div>
    </>
  );
}

/**
 * Secondary navigation, moved out of the top navbar to keep it from getting
 * crowded. The top nav keeps only the most important destinations
 * (Overview, AI Feed, Markets, Swap, xStocks); everything else lives here.
 */
export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  return (
    <Sidebar collapsible="icon" className="top-16 h-[calc(100svh-4rem)]">
      <SidebarHeader>
        <SidebarToggle />
      </SidebarHeader>
      <SidebarContent>
        {isHome ? <OverviewFeedSection /> : null}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => {
                const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {"badge" in item && item.badge ? (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <GlobalSearch />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
