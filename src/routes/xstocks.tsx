import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { EmptyState } from "@/components/common/EmptyState";
import { CoinTable } from "@/components/market/CoinTable";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { DataSourceNote } from "@/components/common/DataSourceNote";
import { coinsQuery } from "@/lib/market/client";
import { xStockRegistry } from "@/config/xstocks";

export const Route = createFileRoute("/xstocks")({
  head: () => ({
    meta: [
      { title: "xStocks — verified tokenized equity registry | RobinPulse" },
      {
        name: "description",
        content:
          "Tokenized stock (xStock) markets tracked from an owner-verified registry with live third-party market data. No unverified assets are listed.",
      },
      { property: "og:title", content: "xStocks — verified tokenized equity registry" },
      {
        property: "og:description",
        content:
          "Tokenized equity markets tracked from an owner-verified registry with live market data.",
      },
    ],
  }),
  component: XStocksPage,
});

function XStocksPage() {
  const ids = xStockRegistry
    .map((item) => item.coinGeckoId)
    .filter((id): id is string => Boolean(id));
  const query = useQuery({ ...coinsQuery(ids), enabled: ids.length > 0 });

  return (
    <PageContainer>
      <SectionHeading
        eyebrow="Tokenized equities"
        title="xStocks"
        description="Only assets present in the owner-verified registry are listed here. Tokenized-equity claims are never inferred from a ticker or token name."
      />
      <div className="mt-6">
        {ids.length === 0 ? (
          <EmptyState
            title="No verified xStocks configured yet"
            description="The verified registry is empty. Add entries in src/config/xstocks.ts with a resolvable contract address or CoinGecko identifier, and this page will populate from live provider data."
          />
        ) : query.isPending ? (
          <TableSkeleton />
        ) : query.isError ? (
          <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
        ) : (
          <>
            <CoinTable
              coins={query.data?.data ?? []}
              emptyLabel="CoinGecko returned no market rows for the verified registry."
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
