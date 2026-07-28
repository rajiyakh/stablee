import { Link } from "@tanstack/react-router";
import { Activity, Menu } from "lucide-react";
import { useState } from "react";
import { isWalletConfigured, projectConfig } from "@/config/project";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";

// Most important destinations only — everything else lives in the left
// sidebar (see AppSidebar.tsx) to keep this from getting crowded.
const navItems = [
  { to: "/", label: "Overview" },
  { to: "/ai-feed", label: "AI Feed" },
  { to: "/markets", label: "Markets" },
  {
    to: "/swap",
    label: "Swap",
    badge: isWalletConfigured() ? undefined : "Soon",
    hot: isWalletConfigured(),
  },
  { to: "/xstocks", label: "xStocks" },
] as const;

// Full list for the mobile menu, where there's no separate sidebar affordance.
// Leaderboard and Data Sources are intentionally left out of both nav lists
// (still reachable directly at /leaderboard and /data) — hidden from nav, not deleted.
const mobileNavItems = [
  ...navItems,
  { to: "/trending", label: "Robinhood Trends" },
  { to: "/agents", label: "Agents" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/token", label: "Token", badge: "Soon" },
] as const;

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg [background-image:linear-gradient(to_right,transparent,var(--color-border)_15%,var(--color-border)_85%,transparent)] [background-position:bottom] [background-repeat:no-repeat] [background-size:100%_1px]">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2"
          aria-label={`${projectConfig.name} home`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {projectConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-foreground [&_.nav-underline]:scale-x-100" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="group relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors"
            >
              {"hot" in item && item.hot ? (
                <span className="relative -top-2 inline-flex self-start">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-negative opacity-75" />
                  <span className="relative inline-flex items-center rounded-full bg-negative px-1 py-px text-[8px] font-bold uppercase tracking-wide text-white">
                    Hot
                  </span>
                </span>
              ) : null}
              {item.label}
              {"badge" in item && item.badge ? (
                <Badge
                  variant="secondary"
                  className="rounded-full px-1.5 py-0 text-[10px] font-semibold leading-4 normal-case tracking-normal"
                >
                  {item.badge}
                </Badge>
              ) : null}
              <span className="nav-underline pointer-events-none absolute inset-x-2.5 -bottom-px h-[1.5px] origin-left scale-x-0 rounded-full bg-foreground transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SidebarTrigger className="hidden md:inline-flex" aria-label="Toggle more navigation" />
          <GlobalSearch />
          {projectConfig.socialLinks.x ? (
            <a
              href={projectConfig.socialLinks.x}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow on X"
              className="hidden h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary/70 sm:inline-flex"
            >
              <XIcon className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <WalletConnectButton className="hidden sm:inline-flex" />
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
