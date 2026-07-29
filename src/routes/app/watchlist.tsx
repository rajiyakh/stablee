import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { BuySwapButton } from "@/components/market/BuySwapButton";
import { useWatchlist } from "@/lib/watchlist";

export const Route = createFileRoute("/app/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — your saved markets | RobinPulse" },
      {
        name: "description",
        content:
          "Your saved coins and on-chain markets, stored locally in your browser and refreshed from live provider data.",
      },
      { property: "og:title", content: "Watchlist — your saved markets" },
      {
        property: "og:description",
        content: "Saved coins and on-chain markets refreshed from live provider data.",
      },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { entries, hydrated, remove, clear } = useWatchlist();

  return (
    <PageContainer>
      <SectionHeading
        eyebrow="Personal"
        title="Watchlist"
        description="Saved locally in your browser. Only identifiers are stored — prices are always fetched live."
        action={
          entries.length ? (
            <Button variant="outline" size="sm" onClick={clear}>
              Clear all
            </Button>
          ) : undefined
        }
      />
      <div className="mt-6">
        {!hydrated ? null : entries.length === 0 ? (
          <EmptyState
            title="Your watchlist is empty"
            description="Use the star button on any market or coin to save it here."
            action={
              <Button asChild size="sm">
                <Link to="/app/markets">Browse markets</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {entries.map((entry) => (
              <li key={entry.key} className="flex items-center gap-3 px-4 py-3">
                {entry.kind === "coin" ? (
                  <Link
                    to="/app/coin/$coinId"
                    params={{ coinId: entry.id }}
                    className="font-medium text-foreground hover:underline"
                  >
                    {entry.name}
                  </Link>
                ) : (
                  <Link
                    to="/app/token/$chainId/$address"
                    params={{ chainId: entry.chainId ?? "", address: entry.address ?? entry.id }}
                    className="font-medium text-foreground hover:underline"
                  >
                    {entry.name}
                  </Link>
                )}
                <span className="text-xs uppercase text-muted-foreground">{entry.symbol}</span>
                <div className="ml-auto flex items-center gap-1.5">
                  {entry.kind === "dex" && entry.chainId && entry.address ? (
                    <BuySwapButton chainId={entry.chainId} address={entry.address} />
                  ) : null}
                  <Button variant="ghost" size="sm" onClick={() => remove(entry.key)}>
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
