import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { DexChartEmbed } from "@/components/market/DexChartEmbed";
import { dexTokenQuery } from "@/lib/market/client";
import { formatUsd } from "@/lib/market/format";
import { projectConfig } from "@/config/project";
import { NATIVE_SENTINEL, WETH_ADDRESS, type SwapTokenConfig } from "@/config/swapTokens";

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
  const top = [...pairs].sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0))[0];

  if (!token || !chainSlug || !chartAddress) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h3 className="text-sm font-semibold text-foreground">{token.symbol} price</h3>
        {top ? (
          <span className="text-lg font-semibold tabular-nums text-foreground">
            {formatUsd(top.priceUsd)}
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
        <DexChartEmbed chainId={top.chainId} pairAddress={top.pairAddress} />
      )}
    </div>
  );
}
