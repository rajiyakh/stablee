import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { DexChartEmbed } from "@/components/market/DexChartEmbed";
import { dexTokenQuery } from "@/lib/market/client";
import { changeClass, formatPercent, formatUsd, shortenAddress } from "@/lib/market/format";
import { projectConfig } from "@/config/project";
import { NATIVE_SENTINEL, WETH_ADDRESS, type SwapTokenConfig } from "@/config/swapTokens";
import type { DexMarket } from "@/lib/market/types";

// Symbols with no meaningful price chart to show: ETH/WETH trade 1:1 (chart
// would just mirror WETH's own near-flat pair), and BTC/WBTC aren't part of
// the curated list today but are excluded pre-emptively for the same reason
// as stablecoins — a flat/mirrored chart isn't worth the layout space.
const CHART_EXCLUDED_SYMBOLS = new Set(["ETH", "WETH", "BTC", "WBTC"]);

/** Whether a token is "interesting" enough to show a live DEX price chart for —
 *  false for the chain's native asset, stablecoins, and major wrapped assets. */
export function isChartEligible(token: SwapTokenConfig | null): boolean {
  if (!token) return false;
  if (token.address.toLowerCase() === NATIVE_SENTINEL.toLowerCase()) return false;
  if (token.isStablecoin) return false;
  return !CHART_EXCLUDED_SYMBOLS.has(token.symbol.toUpperCase());
}

/** One side of the traded pair — symbol, address, and (for the base token
 *  only, which is what DEX Screener actually prices) live USD price + 24h
 *  change. No sparkline: we only have snapshot stats, not a price history,
 *  and this project doesn't fabricate data to fill a visual gap. */
function AssetInfoCard({
  symbol,
  address,
  priceUsd,
  priceChange24h,
}: {
  symbol: string | null;
  address: string | null;
  priceUsd: number | null;
  priceChange24h?: number | null;
}) {
  return (
    <div className="card-surface flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{symbol ?? "—"}</p>
        <p className="truncate text-xs text-muted-foreground">{shortenAddress(address)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-foreground">{formatUsd(priceUsd)}</p>
        {priceChange24h !== undefined ? (
          <p className={`text-xs font-medium tabular-nums ${changeClass(priceChange24h)}`}>
            {formatPercent(priceChange24h)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Price chart for the token being swapped, sourced from DEX Screener's highest-liquidity
 *  pair — the only working price-history source for an arbitrary Robinhood Chain ERC-20
 *  with no CoinGecko id (see src/routes/app/token.$chainId.$address.tsx for the same pattern). */
export function SwapTokenChart({ token }: { token: SwapTokenConfig | null }) {
  const chainSlug = projectConfig.dataSources.robinhoodDexScreenerChainId;
  // Native ETH has no contract of its own to look up a DEX pair for — WETH is
  // the same asset, 1:1 wrapped, and is what actually trades on-chain.
  const chartAddress = token
    ? token.address.toLowerCase() === NATIVE_SENTINEL.toLowerCase()
      ? WETH_ADDRESS
      : token.address
    : null;

  const query = useQuery(dexTokenQuery(chainSlug, chartAddress ?? ""));
  const pairs = query.data?.data ?? [];
  const top: DexMarket | undefined = [...pairs].sort(
    (a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0),
  )[0];

  if (!token || !chainSlug || !chartAddress || !isChartEligible(token)) return null;

  // The pair label/price come from whatever pair DEX Screener actually
  // returned (top.baseToken/quoteToken), not the Swap page's own Sell/Buy
  // selection — the on-chain route is often through an intermediate asset
  // (e.g. WETH) rather than the exact Buy token, so this stays accurate.
  const quotePriceUsd =
    top?.priceUsd !== null && top?.priceUsd !== undefined && top?.priceNative
      ? top.priceUsd / top.priceNative
      : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {top ? (
            <>
              <span>
                {top.baseToken.symbol ?? token.symbol} / {top.quoteToken.symbol ?? "?"}
              </span>
              <span className={`text-xs font-medium ${changeClass(top.priceChange.h24)}`}>
                {formatPercent(top.priceChange.h24)}
              </span>
            </>
          ) : (
            `${token.symbol} price`
          )}
        </h3>
        {top ? (
          <span className="text-lg font-semibold tabular-nums text-foreground">
            {formatUsd(top.priceUsd)}
            {top.quoteToken.symbol ? (
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                {top.quoteToken.symbol}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>

      {query.isPending ? (
        <div className="card-surface p-5">
          <Skeleton className="h-[480px] w-full" />
        </div>
      ) : query.isError ? (
        <div className="card-surface p-5">
          <ErrorState
            message={(query.error as Error).message}
            onRetry={() => query.refetch()}
            className="h-[480px]"
          />
        </div>
      ) : !top ? (
        <div className="card-surface flex h-[240px] items-center justify-center p-5">
          <p className="text-sm text-muted-foreground">
            DEX Screener returned no trading pairs for {token.symbol} on Robinhood Chain.
          </p>
        </div>
      ) : (
        <>
          <DexChartEmbed chainId={top.chainId} pairAddress={top.pairAddress} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <AssetInfoCard
              symbol={top.baseToken.symbol}
              address={top.baseToken.address}
              priceUsd={top.priceUsd}
              priceChange24h={top.priceChange.h24}
            />
            <AssetInfoCard
              symbol={top.quoteToken.symbol}
              address={top.quoteToken.address}
              priceUsd={quotePriceUsd}
            />
          </div>
        </>
      )}
    </div>
  );
}
