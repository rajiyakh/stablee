import { Link } from "@tanstack/react-router";
import { Activity, Menu } from "lucide-react";
import { useState } from "react";
import { isWalletConfigured, projectConfig } from "@/config/project";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";

// Most important destinations only — everything else lives in the left
// sidebar (see AppSidebar.tsx) to keep this from getting crowded.
const navItems = [
  { to: "/", label: "Overview" },
  { to: "/ai-feed", label: "AI Feed" },
  { to: "/markets", label: "Markets" },
  { to: "/swap", label: "Swap", badge: isWalletConfigured() ? undefined : "Soon" },
  { to: "/xstocks", label: "xStocks" },
] as const;

// Full list for the mobile menu, where there's no separate sidebar affordance.
const mobileNavItems = [
  ...navItems,
  { to: "/trending", label: "Robinhood Trends" },
  { to: "/agents", label: "Agents" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/token", label: "Token", badge: "Soon" },
  { to: "/data", label: "Data Sources" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2"
          aria-label={`${projectConfig.name} home`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">
            {projectConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/70"
            >
              {item.label}
              {"badge" in item && item.badge ? (
                <Badge
                  variant="secondary"
                  className="rounded-full px-1.5 py-0 text-[10px] font-semibold leading-4"
                >
                  {item.badge}
                </Badge>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SidebarTrigger className="hidden md:inline-flex" aria-label="Toggle more navigation" />
          <GlobalSearch />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="xl:hidden" aria-label="Open menu">
                <Menu className="h-4 w-4" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="px-4 pt-4 text-sm font-semibold">Navigate</SheetTitle>
              <nav className="mt-4 flex flex-col gap-1 px-2 pb-6" aria-label="Mobile">
                {mobileNavItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.to === "/" }}
                    onClick={() => setOpen(false)}
                    activeProps={{ className: "bg-secondary text-foreground" }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground",
                    )}
                  >
                    {item.label}
                    {"badge" in item && item.badge ? (
                      <Badge
                        variant="secondary"
                        className="rounded-full px-1.5 py-0 text-[10px] font-semibold leading-4"
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
