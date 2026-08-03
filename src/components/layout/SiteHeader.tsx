import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { isWalletConfigured, projectConfig } from "@/config/project";
import { agentHubConfig } from "@/config/agentHub";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { AnimatedPulseLogo } from "@/components/branding/AnimatedPulseLogo";

// Primary top nav — the most important destinations, always visible at xl+.
// Below xl (where this row is hidden) these same items also appear at the
// top of the Menu dropdown, so nothing becomes unreachable on small screens.
const navItems = [
  { to: "/app", label: "Overview" },
  { to: "/app/ai-feed", label: "AI Feed", hot: true },
  { to: "/app/markets", label: "Markets" },
  {
    to: "/app/swap",
    label: "Swap",
    badge: isWalletConfigured() ? undefined : "Soon",
    hot: isWalletConfigured(),
  },
  { to: "/app/bridge", label: "Bridge", badge: isWalletConfigured() ? undefined : "Soon" },
  {
    to: "/app/agents-hub",
    label: "Agent Hub",
    badge: agentHubConfig.mode === "preview" ? "New" : undefined,
  },
] as const;

// Everything that used to live in the sidebar or the mobile hamburger sheet,
// now consolidated into one "Menu" dropdown next to Connect. Portfolio moved
// here from the primary nav (see navItems above). Leaderboard, Data Sources,
// Methodology, and Disclaimer previously had no nav entry at all (direct-URL
// only) — surfaced here for the first time.
const menuItems = [
  {
    to: "/app/portfolio",
    label: "Portfolio",
    tag: "APP",
    badge: isWalletConfigured() ? undefined : "Soon",
  },
  { to: "/app/trending", label: "Robinhood Trends", tag: "MARKET" },
  { to: "/app/agents", label: "Agents", tag: "AI" },
  { to: "/app/watchlist", label: "Watchlist", tag: "APP" },
  { to: "/app/token", label: "Token", tag: "ORCA", badge: "Soon" },
  { to: "/app/leaderboard", label: "Leaderboard", tag: "MARKET" },
  { to: "/app/data", label: "Data Sources", tag: "DOCS" },
  { to: "/app/methodology", label: "Methodology", tag: "DOCS" },
  { to: "/app/disclaimer", label: "Disclaimer", tag: "LEGAL" },
] as const;

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function NavRow({ to, label, badge }: { to: string; label: string; badge?: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/app" }}
      activeProps={{ className: "bg-secondary text-foreground" }}
      className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
    >
      {label}
      {badge ? (
        <Badge
          variant="secondary"
          className="rounded-full px-1.5 py-0 text-[10px] font-semibold leading-4"
        >
          {badge}
        </Badge>
      ) : null}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg [background-image:linear-gradient(to_right,transparent,var(--color-border)_15%,var(--color-border)_85%,transparent)] [background-position:bottom] [background-repeat:no-repeat] [background-size:100%_1px]">
      <div className="mx-auto grid h-14 w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/app"
          className="group flex shrink-0 items-center gap-2 justify-self-start"
          aria-label={`${projectConfig.name} home`}
        >
          <AnimatedPulseLogo size={28} className="group-hover:[--ecg-duration:1.4s]" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {projectConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 justify-self-center xl:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/app" }}
              activeProps={{ className: "text-foreground [&_.nav-underline]:scale-x-100" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="group relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors"
            >
              {"hot" in item && item.hot ? (
                <span className="relative -top-2 inline-flex self-start">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-negative opacity-75" />
                  <span className="relative inline-flex items-center rounded-full bg-negative px-1 py-px text-[8px] font-bold uppercase tracking-wide text-negative-foreground">
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

        <div className="flex items-center gap-2 justify-self-end">
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
          <WalletConnectButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                Menu
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="xl:hidden">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <NavRow
                      to={item.to}
                      label={item.label}
                      badge={"badge" in item ? item.badge : undefined}
                    />
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>
              {menuItems.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link
                    to={item.to}
                    className="flex items-center justify-between gap-3 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <span className="flex items-center gap-1.5">
                      {item.label}
                      {"badge" in item && item.badge ? (
                        <Badge
                          variant="secondary"
                          className="rounded-full px-1.5 py-0 text-[10px] font-semibold leading-4"
                        >
                          {item.badge}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      {item.tag}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
              {projectConfig.socialLinks.x ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a
                      href={projectConfig.socialLinks.x}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <span className="flex items-center gap-1.5">
                        <XIcon className="size-3.5" />X / Twitter
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                        Social
                      </span>
                    </a>
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
