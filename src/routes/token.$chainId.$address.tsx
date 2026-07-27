import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/AppShell";
import { StatCard } from "@/components/market/StatCard";
import { ErrorState } from "@/components/common/ErrorState";
import { CardSkeleton } from "@/components/common/Skeletons";
import { ChangeBadge } from "@/components/common/ChangeBadge";
import { WatchButton } from "@/components/common/WatchButton";
import { RiskFlags } from "@/components/market/RiskFlags";
import { DexChartEmbed } from "@/components/market/DexChartEmbed";
import { EmptyState } from "@/components/common/EmptyState";
import { DataSourceNote } from "@/components/common/DataSourceNote";
import { dexTokenQuery } from "@/lib/market/client";
import { detectRisks } from "@/lib/market/trending";
import { formatAge, formatUsd, shortenAddress } from "@/lib/market/format";

export const Route = createFileRoute("/token/$chainId/$address")({
  head: ({ params }) => {
    const title = `Token ${params.address.slice(0, 10)}… on ${params.chainId} | RobinPulse AI`;
    const description = `Live on-chain pair data, liquidity, volume and risk flags for this ${params.chainId} token, sourced from DEX Screener.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: TokenPage,
});

function TokenPage() {
  const { chainId, address } = Route.useParams();
  const query = useQuery(dexTokenQuery(chainId, address));
  const pairs = query.data?.data ?? [];
  const top = [...pairs].sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0))[0];

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
  if (!top)
    return (
      <PageContainer>
        <EmptyState
          title="No pairs found"
          description="DEX Screener returned no trading pairs for this token on this chain."
        />
      </PageContainer>
    );

  const symbol = top.baseToken.symbol ?? shortenAddress(top.baseToken.address);

  return (
    <PageContainer>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-foreground">{symbol}</h1>
          <p className="text-xs text-muted-foreground">
            {top.baseToken.name ?? "Unknown token"} · {chainId} · {shortenAddress(address, 6)}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-2xl font-semibold tabular-nums text-foreground">
            {formatUsd(top.priceUsd)}
          </span>
          <ChangeBadge value={top.priceChange.h24} />
          <WatchButton
            entry={{
              kind: "dex",
              id: top.pairAddress,
              chainId,
              address,
              symbol,
              name: top.baseToken.name ?? symbol,
            }}
          />
        </div>
      </div>

      <RiskFlags flags={detectRisks(top)} className="mt-4" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Liquidity" value={formatUsd(top.liquidityUsd, { compact: true })} />
        <StatCard label="24h volume" value={formatUsd(top.volume.h24, { compact: true })} />
        <StatCard label="Market cap" value={formatUsd(top.marketCap, { compact: true })} />
        <StatCard label="Pair age" value={formatAge(top.pairCreatedAt)} />
      </div>

      <div className="mt-6">
        <DexChartEmbed chainId={top.chainId} pairAddress={top.pairAddress} />
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">All pairs ({pairs.length})</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {pairs.map((p) => (
            <li key={p.pairAddress} className="flex flex-wrap items-center gap-3 py-2">
              <span className="font-medium text-foreground">
                {p.baseToken.symbol ?? "?"}/{p.quoteToken.symbol ?? "?"}
              </span>
              <span className="text-xs text-muted-foreground">{p.dexId ?? "unknown dex"}</span>
              <span className="ml-auto tabular-nums">{formatUsd(p.priceUsd)}</span>
              <span className="w-24 text-right tabular-nums text-muted-foreground">
                {formatUsd(p.liquidityUsd, { compact: true })}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <DataSourceNote
        className="mt-3"
        source="DEX Screener"
        fetchedAt={query.data?.fetchedAt}
        stale={query.data?.stale}
      />
    </PageContainer>
  );
}
