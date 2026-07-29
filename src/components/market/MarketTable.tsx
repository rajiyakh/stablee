import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChangeBadge } from "@/components/common/ChangeBadge";
import { TrendScoreBadge } from "@/components/common/TrendScoreBadge";
import { WatchButton } from "@/components/common/WatchButton";
import { BuySwapButton } from "./BuySwapButton";
import { RiskFlags } from "./RiskFlags";
import { formatAge, formatNumber, formatUsd, shortenAddress } from "@/lib/market/format";
import type { ScoredMarket } from "@/lib/market/types";
import { cn } from "@/lib/utils";

type SortKey = "score" | "volume" | "liquidity" | "change" | "age";

const PAGE_SIZE = 25;

const headers: Array<{ key: SortKey | null; label: string; align?: "right" }> = [
  { key: null, label: "Market" },
  { key: null, label: "Price", align: "right" },
  { key: "change", label: "24h", align: "right" },
  { key: "volume", label: "24h volume", align: "right" },
  { key: "liquidity", label: "Liquidity", align: "right" },
  { key: "age", label: "Age", align: "right" },
  { key: "score", label: "Trend", align: "right" },
];

function sortValue(entry: ScoredMarket, key: SortKey): number {
  const m = entry.market;
  switch (key) {
    case "volume":
      return m.volume.h24 ?? -1;
    case "liquidity":
      return m.liquidityUsd ?? -1;
    case "change":
      return m.priceChange.h24 ?? Number.NEGATIVE_INFINITY;
    case "age":
      return m.pairCreatedAt ?? 0;
    default:
      return entry.trendScore ?? -1;
  }
}

export function MarketTable({
  markets,
  showRisks = true,
  emptyLabel = "No markets to display.",
}: {
  markets: ScoredMarket[];
  showRisks?: boolean;
  emptyLabel?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [desc, setDesc] = useState(true);
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const copy = [...markets];
    copy.sort((a, b) => (desc ? 1 : -1) * (sortValue(b, sortKey) - sortValue(a, sortKey)));
    return copy;
  }, [markets, sortKey, desc]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  // Reset to page 1 whenever the underlying data or sort changes, so we
  // never strand the user on a now-out-of-range page.
  useEffect(() => {
    setPage(0);
  }, [markets, sortKey, desc]);

  const pageRows = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (!markets.length) {
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
            {headers.map((header) => (
              <TableHead
                key={header.label}
                className={cn("whitespace-nowrap", header.align === "right" && "text-right")}
              >
                {header.key ? (
                  <button
                    type="button"
                    className="font-medium hover:text-foreground"
                    onClick={() => {
                      if (sortKey === header.key) setDesc((v) => !v);
                      else {
                        setSortKey(header.key as SortKey);
                        setDesc(true);
                      }
                    }}
                    aria-label={`Sort by ${header.label}`}
                  >
                    {header.label}
                    {sortKey === header.key ? (desc ? " ↓" : " ↑") : ""}
                  </button>
                ) : (
                  header.label
                )}
              </TableHead>
            ))}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((entry) => {
            const m = entry.market;
            return (
              <TableRow key={`${m.chainId}-${m.pairAddress}`}>
                <TableCell>
                  <Link
                    to="/app/token/$chainId/$address"
                    params={{ chainId: m.chainId, address: m.baseToken.address }}
                    className="group block"
                  >
                    <span className="font-medium text-foreground group-hover:underline">
                      {m.baseToken.symbol ?? shortenAddress(m.baseToken.address)}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      /{m.quoteToken.symbol ?? "?"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {m.chainId}
                      {m.dexId ? ` · ${m.dexId}` : ""}
                    </span>
                  </Link>
                  {showRisks ? <RiskFlags flags={entry.risks} max={2} className="mt-1" /> : null}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatUsd(m.priceUsd)}</TableCell>
                <TableCell className="text-right">
                  <ChangeBadge value={m.priceChange.h24} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUsd(m.volume.h24, { compact: true })}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUsd(m.liquidityUsd, { compact: true })}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatAge(m.pairCreatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  {entry.trendScore === null ? (
                    <span className="text-xs text-muted-foreground">Not enough data</span>
                  ) : (
                    <TrendScoreBadge
                      score={entry.trendScore}
                      reasons={Object.entries(entry.components)
                        .filter(([, v]) => v !== null)
                        .map(([k, v]) => `${k}: ${(v as number).toFixed(1)}`)}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    <BuySwapButton chainId={m.chainId} address={m.baseToken.address} />
                    <WatchButton
                      entry={{
                        kind: "dex",
                        id: m.pairAddress,
                        chainId: m.chainId,
                        address: m.baseToken.address,
                        symbol: m.baseToken.symbol ?? shortenAddress(m.baseToken.address),
                        name: m.baseToken.name ?? m.baseToken.symbol ?? "Unknown token",
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
        <span>{formatNumber(rows.length)} markets · all figures from live provider responses</span>
        {pageCount > 1 ? (
          <div className="flex items-center gap-2">
            <span>
              Page {page + 1} of {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="size-3.5" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
