import { formatPercent } from "@/lib/market/format";
import type { TrendingTokenInfo } from "@/lib/feed/types";

/** Real trending-token data, colored by 1h change — a different view of the same real numbers, not new data. */
export function TokenHeatmap({ tokens }: { tokens: TrendingTokenInfo[] }) {
  if (tokens.length === 0) {
    return <p className="text-sm text-muted-foreground">No trending tokens right now.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {tokens.slice(0, 12).map((token) => {
        const change = token.priceChange1h ?? 0;
        const intensity = Math.min(Math.abs(change) / 40, 1);
        const positive = change >= 0;
        return (
          <div
            key={`${token.chainId}:${token.address}`}
            className="flex flex-col items-center justify-center rounded-lg p-3 text-center text-foreground"
            style={{
              backgroundColor: positive
                ? `color-mix(in oklch, var(--color-positive) ${20 + intensity * 55}%, var(--color-card))`
                : `color-mix(in oklch, var(--color-negative) ${20 + intensity * 55}%, var(--color-card))`,
            }}
          >
            <span className="truncate text-xs font-semibold">{token.symbol}</span>
            <span className="tabular mt-1 text-[11px] opacity-90">
              {formatPercent(token.priceChange1h)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
