import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { newLaunchesQuery } from "@/lib/feed/client";
import { changeClass, formatPercent, formatUsd } from "@/lib/market/format";
import type { NewLaunchInfo } from "@/lib/feed/types";

/**
 * Site-wide scrolling strip of real, provider-timestamped new pair launches
 * — see newLaunchConfig (config/newLaunches.ts) for the actual age/liquidity
 * thresholds. Renders nothing when there's nothing new right now: a
 * decorative marquee with an empty-state message would just be a static
 * bar doing nothing, which is worse than not being there.
 */
export function NewLaunchTicker() {
  const query = useQuery(newLaunchesQuery());
  const launches = query.data ?? [];

  if (launches.length === 0) return null;

  // Duplicated once so the CSS animation (translateX 0 -> -50%) loops seamlessly.
  const items = [...launches, ...launches];

  return (
    <div className="group relative overflow-hidden border-b border-border/60 bg-card/60 py-2">
      <div className="ticker-track flex w-max items-center gap-8 group-hover:[animation-play-state:paused]">
        {items.map((launch, index) => (
          <TickerItem key={`${launch.chainId}:${launch.address}:${index}`} launch={launch} />
        ))}
      </div>
    </div>
  );
}

function TickerItem({ launch }: { launch: NewLaunchInfo }) {
  return (
    <Link
      to="/token/$chainId/$address"
      params={{ chainId: launch.chainId, address: launch.address }}
      className="flex shrink-0 items-center gap-2 text-xs whitespace-nowrap hover:opacity-80"
    >
      <span className="relative inline-flex size-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
      </span>
      <span className="font-semibold text-foreground">{launch.symbol}</span>
      <span className="tabular-nums text-muted-foreground">{formatUsd(launch.priceUsd)}</span>
      {launch.priceChange1h !== null ? (
        <span className={`tabular-nums ${changeClass(launch.priceChange1h)}`}>
          {formatPercent(launch.priceChange1h)}
        </span>
      ) : null}
      <span className="text-muted-foreground">{Math.round(launch.pairAgeMinutes)}m old</span>
    </Link>
  );
}
