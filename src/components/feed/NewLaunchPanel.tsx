import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/market/format";
import type { NewLaunchInfo } from "@/lib/feed/types";

export function NewLaunchPanel({ launches }: { launches: NewLaunchInfo[] }) {
  if (launches.length === 0) {
    return <p className="text-xs text-muted-foreground">No new launches detected right now.</p>;
  }

  return (
    <ul className="space-y-2">
      {launches.slice(0, 8).map((l) => (
        <li key={`${l.chainId}:${l.address}`} className="rounded-lg border border-border/70 p-2">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/token/$chainId/$address"
              params={{ chainId: l.chainId, address: l.address }}
              className="truncate text-xs font-semibold text-foreground hover:underline"
            >
              {l.symbol}
            </Link>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {Math.round(l.pairAgeMinutes)}m
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">{formatUsd(l.priceUsd)}</span>
            {l.trendingWithinOneHour ? (
              <Badge className="rounded-full bg-brand px-1.5 py-0 text-[9px] text-brand-foreground">
                Trending 1H
              </Badge>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
