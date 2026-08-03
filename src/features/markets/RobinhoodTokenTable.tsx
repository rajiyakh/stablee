import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WatchButton } from "@/components/common/WatchButton";
import { BuySwapButton } from "@/components/market/BuySwapButton";
import { CopyContractButton } from "@/components/feed/CopyContractButton";
import { TokenLogo } from "./TokenLogo";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  changeClass,
  formatCompactUsd,
  formatNumber,
  formatPairAge,
  formatPercent,
} from "@/lib/market/format";
import { cn } from "@/lib/utils";
import {
  intervalBuys,
  intervalPriceChange,
  intervalSells,
  intervalTransactions,
  intervalVolume,
} from "./intervalFields";
import type { GmgnInterval, RobinhoodHotSearchToken, RobinhoodTrendingToken } from "@/types/gmgn";

type SortKey =
  | "rank"
  | "marketCap"
  | "athMarketCap"
  | "liquidity"
  | "volume"
  | "transactions"
  | "holders"
  | "age"
  | "priceChange"
  | "totalFees"
  | "searchHeat";

function sortValue(
  token: RobinhoodTrendingToken,
  key: SortKey,
  interval: GmgnInterval,
): number | undefined {
  switch (key) {
    case "rank":
      return token.rank;
    case "marketCap":
      return token.marketCapUsd;
    case "athMarketCap":
      return token.athMarketCapUsd;
    case "liquidity":
      return token.liquidityUsd;
    case "volume":
      return intervalVolume(token, interval);
    case "transactions":
      return intervalTransactions(token, interval);
    case "holders":
      return token.holders;
    case "age":
      return token.ageSeconds;
    case "priceChange":
      return intervalPriceChange(token, interval);
    case "totalFees":
      return token.totalFeesNative;
    case "searchHeat":
      return (token as RobinhoodHotSearchToken).searchHeat ?? token.visitingCount;
  }
}

/**
 * Missing values never sort as zero — they always fall to the bottom of the
 * list regardless of sort direction, since "unknown" is not "lowest".
 */
function compare(
  a: RobinhoodTrendingToken,
  b: RobinhoodTrendingToken,
  key: SortKey,
  interval: GmgnInterval,
  desc: boolean,
) {
  const av = sortValue(a, key, interval);
  const bv = sortValue(b, key, interval);
  if (av === undefined && bv === undefined) return 0;
  if (av === undefined) return 1;
  if (bv === undefined) return -1;
  return desc ? bv - av : av - bv;
}

interface ColumnDef {
  key: SortKey | null;
  label: string;
}

export function RobinhoodTokenTable({
  tokens,
  interval,
  variant,
  emptyLabel,
  onOpenToken,
}: {
  tokens: RobinhoodTrendingToken[] | RobinhoodHotSearchToken[];
  interval: GmgnInterval;
  variant: "trending" | "hot-searches";
  emptyLabel: string;
  onOpenToken: (token: RobinhoodTrendingToken) => void;
}) {
  const isMobile = useIsMobile();
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [desc, setDesc] = useState(false);

  const rows = useMemo(() => {
    const copy = [...tokens];
    copy.sort((a, b) => compare(a, b, sortKey, interval, desc));
    return copy;
  }, [tokens, sortKey, interval, desc]);

  if (!tokens.length) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-card/60 px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  const rankColumn: ColumnDef =
    variant === "hot-searches"
      ? { key: "searchHeat", label: "Search Heat" }
      : { key: "rank", label: "Rank" };

  const columns: ColumnDef[] = [
    rankColumn,
    { key: null, label: "Token / Age" },
    { key: "marketCap", label: "Market Cap" },
    { key: "athMarketCap", label: "ATH Market Cap" },
    { key: "liquidity", label: "Liquidity" },
    { key: "volume", label: `Volume (${interval})` },
    { key: "transactions", label: `Txns (${interval})` },
    { key: null, label: "Buys / Sells" },
    { key: "holders", label: "Holders" },
    { key: null, label: "Price" },
    { key: "priceChange", label: `Change (${interval})` },
    { key: "totalFees", label: "Total Fees" },
    { key: null, label: "Risk" },
  ];

  const onSort = (key: SortKey | null) => {
    if (!key) return;
    if (sortKey === key) setDesc((v) => !v);
    else {
      setSortKey(key);
      setDesc(true);
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-2">
        {rows.map((token) => (
          <MobileTokenCard
            key={token.address}
            token={token}
            interval={interval}
            variant={variant}
            onOpen={() => onOpenToken(token)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card backdrop-blur-md">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card backdrop-blur-md">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10" />
            {columns.map((col) => (
              <TableHead key={col.label} className="whitespace-nowrap">
                {col.key ? (
                  <button
                    type="button"
                    className="font-medium hover:text-foreground"
                    onClick={() => onSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key ? (desc ? " ↓" : " ↑") : ""}
                  </button>
                ) : (
                  col.label
                )}
              </TableHead>
            ))}
            <TableHead className="w-24 text-right">Buy</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((token) => {
            const heat = (token as RobinhoodHotSearchToken).searchHeat ?? token.visitingCount;
            const buys = intervalBuys(token, interval);
            const sells = intervalSells(token, interval);
            const priceChange = intervalPriceChange(token, interval);
            return (
              <TableRow
                key={token.address}
                className="cursor-pointer"
                onClick={() => onOpenToken(token)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <WatchButton
                    entry={{
                      kind: "dex",
                      id: token.pairAddress ?? token.address,
                      chainId: "robinhood",
                      address: token.address,
                      symbol: token.symbol,
                      name: token.name,
                    }}
                  />
                </TableCell>
                <TableCell className="tabular-nums">
                  {variant === "hot-searches" ? formatNumber(heat) : `#${token.rank}`}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TokenLogo
                      logoUrl={token.logoUrl}
                      symbol={token.symbol}
                      size={28}
                      sizeClassName="size-7"
                      textClassName="text-[10px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{token.symbol}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPairAge(token.ageSeconds)} old
                      </p>
                    </div>
                    <span onClick={(e) => e.stopPropagation()}>
                      <CopyContractButton address={token.address} />
                    </span>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatCompactUsd(token.marketCapUsd)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatCompactUsd(token.athMarketCapUsd)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatCompactUsd(token.liquidityUsd)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatCompactUsd(intervalVolume(token, interval))}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatNumber(intervalTransactions(token, interval))}
                </TableCell>
                <TableCell className="tabular-nums text-xs">
                  {buys === undefined && sells === undefined ? (
                    "—"
                  ) : (
                    <>
                      <span className="text-positive">{formatNumber(buys)}</span>
                      {" / "}
                      <span className="text-negative">{formatNumber(sells)}</span>
                    </>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">{formatNumber(token.holders)}</TableCell>
                <TableCell className="tabular-nums">{formatCompactUsd(token.priceUsd)}</TableCell>
                <TableCell className={cn("tabular-nums", changeClass(priceChange))}>
                  {formatPercent(priceChange)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatNumber(token.totalFeesNative)}
                </TableCell>
                <TableCell>
                  {token.security?.honeypot ? (
                    <span className="rounded-full bg-negative/10 px-2 py-0.5 text-xs text-negative">
                      Honeypot
                    </span>
                  ) : token.security?.renounced ? (
                    <span className="rounded-full bg-positive/10 px-2 py-0.5 text-xs text-positive">
                      Renounced
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <BuySwapButton chainId="robinhood" address={token.address} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
        {formatNumber(rows.length)} Robinhood Mainnet tokens · {interval} interval
      </p>
    </div>
  );
}

function MobileTokenCard({
  token,
  interval,
  variant,
  onOpen,
}: {
  token: RobinhoodTrendingToken | RobinhoodHotSearchToken;
  interval: GmgnInterval;
  variant: "trending" | "hot-searches";
  onOpen: () => void;
}) {
  const priceChange = intervalPriceChange(token, interval);
  const heat = (token as RobinhoodHotSearchToken).searchHeat ?? token.visitingCount;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card backdrop-blur-md p-3 text-left"
    >
      <TokenLogo
        logoUrl={token.logoUrl}
        symbol={token.symbol}
        size={36}
        sizeClassName="size-9"
        textClassName="text-xs"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-foreground">{token.symbol}</p>
          <p className={cn("shrink-0 text-xs tabular-nums", changeClass(priceChange))}>
            {formatPercent(priceChange)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {variant === "hot-searches" ? `Heat ${formatNumber(heat)}` : `#${token.rank}`} ·{" "}
            {formatPairAge(token.ageSeconds)}
          </span>
          <span className="tabular-nums">{formatCompactUsd(token.marketCapUsd)}</span>
        </div>
      </div>
    </button>
  );
}
