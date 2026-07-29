import { Link } from "@tanstack/react-router";
import { BuySwapButton } from "@/components/market/BuySwapButton";
import { formatUsd, changeClass, formatPercent } from "@/lib/market/format";
import type { TrendingTokenInfo } from "@/lib/feed/types";

export function TrendingTokenPanel({
  tokens,
  onSelect,
  emptyMessage = "No trending tokens right now.",
  interactive = true,
}: {
  tokens: TrendingTokenInfo[];
  onSelect?: (token: TrendingTokenInfo) => void;
  emptyMessage?: string;
  /** Set false for read-only previews (e.g. the landing page) — no link into /app, no Buy button. */
  interactive?: boolean;
}) {
  if (tokens.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyMessage}</p>;
  }

  const Row = interactive ? "button" : "div";

  return (
    <ul className="divide-y divide-border/70">
      {tokens.slice(0, 10).map((t) => (
        <li key={`${t.chainId}:${t.address}`}>
          <Row
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onSelect?.(t) : undefined}
            className={`flex w-full items-center gap-2 py-2 text-left ${interactive ? "hover:bg-secondary/50" : ""}`}
          >
            <span className="w-5 shrink-0 text-[11px] text-muted-foreground">{t.rank}</span>
            <span className="min-w-0 flex-1">
              {interactive ? (
                <Link
                  to="/app/token/$chainId/$address"
                  params={{ chainId: t.chainId, address: t.address }}
                  onClick={(e) => e.stopPropagation()}
                  className="block truncate text-xs font-semibold text-foreground hover:underline"
                >
                  {t.symbol}
                </Link>
              ) : (
                <span className="block truncate text-xs font-semibold text-foreground">
                  {t.symbol}
                </span>
              )}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-foreground">
              {formatUsd(t.priceUsd)}
            </span>
            <span
              className={`w-14 shrink-0 text-right text-[11px] tabular-nums ${changeClass(t.priceChange1h)}`}
            >
              {formatPercent(t.priceChange1h)}
            </span>
            {interactive ? (
              <span onClick={(e) => e.stopPropagation()} className="shrink-0">
                <BuySwapButton chainId={t.chainId} address={t.address} />
              </span>
            ) : null}
          </Row>
        </li>
      ))}
    </ul>
  );
}
