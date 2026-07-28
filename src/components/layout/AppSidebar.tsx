import { Link, useRouterState } from "@tanstack/react-router";
import { Coins, Star, TrendingUp, Users } from "lucide-react";
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
import { GlobalSearch } from "./GlobalSearch";
import { SidebarToggle } from "./SiteHeader";

// Leaderboard and Data Sources are intentionally left out (still reachable
// directly at /leaderboard and /data) — hidden from nav, not deleted.
const secondaryItems = [
  { to: "/trending", label: "Robinhood Trends", icon: TrendingUp },
  { to: "/agents", label: "Agents", icon: Users },
  { to: "/watchlist", label: "Watchlist", icon: Star },
  { to: "/token", label: "Token", icon: Coins, badge: "Soon" },
] as const;

/**
 * Secondary navigation, moved out of the top navbar to keep it from getting
 * crowded. The top nav keeps only the most important destinations
 * (Overview, AI Feed, Markets, Swap, xStocks); everything else lives here.
 */
export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon" className="top-16 h-[calc(100svh-4rem)]">
      <SidebarHeader>
        <SidebarToggle />
      </SidebarHeader>
      <SidebarContent>
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
