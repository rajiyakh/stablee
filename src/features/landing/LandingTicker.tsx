import { changeClass, formatPercent, formatUsd } from "@/lib/market/format";
import type { TrendingTokenInfo } from "@/lib/feed/types";

/**
 * Real trending-token strip, same marquee technique as NewLaunchTicker.tsx
 * (content duplicated once for a seamless loop). Renders nothing when there's
 * no real data yet rather than a placeholder bar with nothing moving in it.
 */
export function LandingTicker({ tokens }: { tokens: TrendingTokenInfo[] }) {
  if (tokens.length === 0) return null;
  const items = [...tokens, ...tokens];

  return (
    <div className="overflow-hidden border-y border-border/60 bg-card/60 py-3 backdrop-blur-sm">
      <div className="ticker-track flex w-max items-center gap-10">
        {items.map((token, index) => (
          <div
            key={`${token.chainId}:${token.address}:${index}`}
            className="flex shrink-0 items-center gap-2 text-sm whitespace-nowrap"
          >
            <span className="font-semibold text-foreground">{token.symbol}</span>
            <span className="tabular text-muted-foreground">{formatUsd(token.priceUsd)}</span>
            {token.priceChange1h !== null ? (
              <span className={`tabular ${changeClass(token.priceChange1h)}`}>
                {formatPercent(token.priceChange1h)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
