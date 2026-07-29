import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { CoinTable } from "@/components/market/CoinTable";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { DataSourceNote } from "@/components/common/DataSourceNote";
import { coinsQuery } from "@/lib/market/client";

export const Route = createFileRoute("/markets/global")({
  head: () => ({
    meta: [
      { title: "Global Markets — Live crypto market data | RobinPulse" },
      {
        name: "description",
        content:
          "Live prices, 24h volume and market capitalisation for top crypto assets, sourced directly from CoinGecko.",
      },
      { property: "og:title", content: "Global Markets — Live crypto market data" },
      {
        property: "og:description",
        content: "Live prices, volume and market capitalisation sourced directly from CoinGecko.",
      },
    ],
  }),
  component: GlobalMarketsPage,
});

function GlobalMarketsPage() {
  const query = useQuery(coinsQuery([]));

  return (
    <PageContainer>
      <SectionHeading
        eyebrow="CoinGecko · Global"
        title="Global Markets"
        description="Top markets by capitalisation, across every chain CoinGecko tracks. For Robinhood Mainnet only, see Markets → Trending. Every figure is taken from the provider response; blanks mean the provider returned no value."
      />
      <div className="mt-6">
        {query.isPending ? (
          <TableSkeleton />
        ) : query.isError ? (
          <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
        ) : (
          <>
            <CoinTable
              coins={query.data?.data ?? []}
              emptyLabel="CoinGecko returned no market rows."
            />
            <DataSourceNote
              className="mt-3"
              source="CoinGecko"
              fetchedAt={query.data?.fetchedAt}
              stale={query.data?.stale}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
}
