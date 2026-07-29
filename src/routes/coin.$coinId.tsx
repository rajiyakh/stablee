import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/AppShell";
import { StatCard } from "@/components/market/StatCard";
import { PriceChart } from "@/components/market/PriceChart";
import { TradingViewAdvancedChart } from "@/components/market/TradingViewAdvancedChart";
import { ErrorState } from "@/components/common/ErrorState";
import { CardSkeleton } from "@/components/common/Skeletons";
import { ChangeBadge } from "@/components/common/ChangeBadge";
import { WatchButton } from "@/components/common/WatchButton";
import { coinQuery } from "@/lib/market/client";
import { formatUsd } from "@/lib/market/format";
import { xStockRegistry } from "@/config/xstocks";

export const Route = createFileRoute("/coin/$coinId")({
  head: ({ params }) => {
    const title = `${params.coinId} — live price & market data | RobinPulse`;
    const description = `Live price, 24h volume, market capitalisation and price history for ${params.coinId}, sourced from CoinGecko.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CoinPage,
});

function CoinPage() {
  const { coinId } = Route.useParams();
  const query = useQuery(coinQuery(coinId));
  const coin = query.data?.data;
  const xStock = xStockRegistry.find((item) => item.coinGeckoId === coinId);

  if (query.isPending)
    return (
      <PageContainer>
        <CardSkeleton />
      </PageContainer>
    );
  if (query.isError)
    return (
      <PageContainer>
        <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
      </PageContainer>
    );
  if (!coin)
    return (
      <PageContainer>
        <ErrorState
          title="No data returned"
          message="CoinGecko returned no record for this asset."
        />
      </PageContainer>
    );

  return (
    <PageContainer>
      <div className="flex flex-wrap items-center gap-3">
        {coin.image ? (
          <img src={coin.image} alt="" width={40} height={40} className="h-10 w-10 rounded-full" />
        ) : null}
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-foreground">{coin.name}</h1>
          <p className="text-xs uppercase text-muted-foreground">{coin.symbol}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-2xl font-semibold tabular-nums text-foreground">
            {formatUsd(coin.price)}
          </span>
          <ChangeBadge value={coin.change24h} />
          <WatchButton
            entry={{ kind: "coin", id: coin.id, symbol: coin.symbol, name: coin.name }}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Market cap" value={formatUsd(coin.marketCap, { compact: true })} />
        <StatCard label="24h volume" value={formatUsd(coin.volume24h, { compact: true })} />
        <StatCard label="Fully diluted" value={formatUsd(coin.fdv, { compact: true })} />
        <StatCard label="Rank" value={coin.marketCapRank ? `#${coin.marketCapRank}` : "—"} />
      </div>

      <div className="mt-6">
        <PriceChart coinId={coin.id} />
      </div>

      {xStock?.underlyingTicker ? (
        <div className="mt-6">
          <TradingViewAdvancedChart symbol={xStock.underlyingTicker} />
        </div>
      ) : null}

      {coin.description ? (
        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">About</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{coin.description}</p>
        </section>
      ) : null}
    </PageContainer>
  );
}
