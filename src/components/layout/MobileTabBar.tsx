import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ChartLine, ArrowLeftRight, Wallet, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * App-like bottom tab bar, mobile only (md:hidden — matches the sidebar's
 * own mobile/desktop boundary in use-mobile.tsx). Icon-only, no visible
 * label — each tab's label is still exposed to screen readers via aria-label.
 */
const TABS = [
  { to: "/app", label: "Overview", icon: Home },
  { to: "/app/markets", label: "Markets", icon: ChartLine },
  { to: "/app/swap", label: "Swap", icon: ArrowLeftRight },
  { to: "/app/portfolio", label: "Portfolio", icon: Wallet },
  { to: "/app/agents-hub", label: "Agent Hub", icon: Bot },
] as const;

export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid h-16 grid-cols-5">
        {TABS.map((tab) => {
          const isActive = tab.to === "/app" ? pathname === "/app" : pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className={cn(
                "flex items-center justify-center text-muted-foreground transition-colors",
                isActive && "text-primary",
              )}
            >
              <tab.icon className="size-6" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
