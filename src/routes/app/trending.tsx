import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { MarketTable } from "@/components/market/MarketTable";
import { CoinTable } from "@/components/market/CoinTable";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { DataSourceNote } from "@/components/common/DataSourceNote";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { chainTrendingQuery, coinsQuery, globalTrendingQuery } from "@/lib/market/client";
import { projectConfig } from "@/config/project";

export const Route = createFileRoute("/app/trending")({
  head: () => ({
    meta: [
      { title: "Trending markets — transparent trend scoring | RobinPulse" },
      {
        name: "description",
        content:
          "Trending crypto assets and on-chain markets ranked by a published trend score built from real volume, liquidity and momentum data.",
      },
      { property: "og:title", content: "Trending markets — transparent trend scoring" },
      {
        property: "og:description",
        content: "Trending assets ranked by a published, auditable trend score.",
      },
    ],
  }),
  component: TrendingPage,
});

function TrendingPage() {
  const chainId = projectConfig.dataSources.robinhoodDexScreenerChainId;
  const trending = useQuery(globalTrendingQuery());
  const ids = (trending.data?.data ?? []).map((c) => c.id);
  const coins = useQuery({ ...coinsQuery(ids), enabled: ids.length > 0 });
  const chain = useQuery(chainTrendingQuery(chainId));

  return (
    <PageContainer>
      <SectionHeading
        eyebrow="Discovery"
        title="Trending"
        description="Global search interest from CoinGecko alongside on-chain trend scoring for the configured Robinhood chain."
      />
      <Tabs defaultValue="chain" className="mt-6">
        <TabsList>
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="chain">Robinhood Mainnet</TabsTrigger>
        </TabsList>
        <TabsContent value="global" className="mt-6">
          {trending.isPending || coins.isPending ? (
            <TableSkeleton />
          ) : trending.isError ? (
            <ErrorState
              message={(trending.error as Error).message}
              onRetry={() => trending.refetch()}
            />
          ) : (
            <>
              <CoinTable
                coins={coins.data?.data ?? []}
                emptyLabel="No trending markets were returned."
              />
              <DataSourceNote
                className="mt-3"
                source="CoinGecko"
                fetchedAt={trending.data?.fetchedAt}
                stale={trending.data?.stale}
              />
            </>
          )}
        </TabsContent>
        <TabsContent value="chain" className="mt-6">
          {!chainId ? (
            <EmptyState
              title="Robinhood Mainnet is not configured yet"
              description="No DEX Screener chain identifier has been supplied for Robinhood Mainnet, so no on-chain markets can be retrieved. Nothing is shown in place of real data."
            />
          ) : chain.isPending ? (
            <TableSkeleton />
          ) : chain.isError ? (
            <ErrorState message={(chain.error as Error).message} onRetry={() => chain.refetch()} />
          ) : (
            <>
              <MarketTable
                markets={chain.data?.data?.markets ?? []}
                emptyLabel="The provider returned no markets for this chain."
              />
              <DataSourceNote
                className="mt-3"
                source="DEX Screener"
                fetchedAt={chain.data?.fetchedAt}
                stale={chain.data?.stale}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
