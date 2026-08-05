import { Link } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChangeBadge } from "@/components/common/ChangeBadge";
import { SentimentBadge } from "@/components/common/SentimentBadge";
import { WatchButton } from "@/components/common/WatchButton";
import { formatUsd } from "@/lib/market/format";
import type { CoinMarket } from "@/lib/market/types";

export function CoinTable({
  coins,
  emptyLabel = "No coins to display.",
}: {
  coins: CoinMarket[];
  emptyLabel?: string;
}) {
  if (!coins.length) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-card/60 px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">#</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">24h</TableHead>
            <TableHead className="text-right">24h volume</TableHead>
            <TableHead className="text-right">Market cap</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {coins.map((coin) => (
            <TableRow key={coin.id}>
              <TableCell className="text-muted-foreground tabular-nums">
                {coin.marketCapRank ?? "—"}
              </TableCell>
              <TableCell>
                <Link
                  to="/app/coin/$coinId"
                  params={{ coinId: coin.id }}
                  className="flex items-center gap-2 hover:underline"
                >
                  {coin.image ? (
                    <img
                      src={coin.image}
                      alt=""
                      loading="lazy"
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : null}
                  <span className="font-medium text-foreground">{coin.name}</span>
                  <span className="text-xs uppercase text-muted-foreground">{coin.symbol}</span>
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatUsd(coin.currentPrice)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <ChangeBadge value={coin.priceChangePercentage24h} />
                  <SentimentBadge priceChange24h={coin.priceChangePercentage24h} />
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatUsd(coin.totalVolume, { compact: true })}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatUsd(coin.marketCap, { compact: true })}
              </TableCell>
              <TableCell>
                <WatchButton
                  entry={{ kind: "coin", id: coin.id, symbol: coin.symbol, name: coin.name }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
