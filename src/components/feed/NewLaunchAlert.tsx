import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RiskFlags } from "@/components/market/RiskFlags";
import { CopyContractButton } from "./CopyContractButton";
import { MarketMetricsRow } from "./MarketMetricsRow";
import { formatUsd, changeClass, formatPercent } from "@/lib/market/format";
import type { NewLaunchInfo } from "@/lib/feed/types";

export function NewLaunchAlert({ launch }: { launch: NewLaunchInfo }) {
  return (
    <article
      className={
        "rounded-xl border p-4 sm:p-5 " +
        (launch.trendingWithinOneHour ? "border-brand/50 bg-brand/5" : "border-border bg-card")
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Rocket className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">New Launch</span>
          {launch.trendingWithinOneHour ? (
            <Badge className="rounded-full bg-brand text-brand-foreground">
              New Launch · Trending Within 1H
            </Badge>
          ) : null}
        </div>
        <span className="text-xs text-muted-foreground">
          {Math.round(launch.pairAgeMinutes)}m old
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Link
          to="/token/$chainId/$address"
          params={{ chainId: launch.chainId, address: launch.address }}
          className="text-sm font-semibold text-foreground hover:underline"
        >
          {launch.symbol}
        </Link>
        <span className="text-xs text-muted-foreground">{launch.name}</span>
        <CopyContractButton address={launch.address} />
        {launch.trendingRank ? (
          <span className="text-xs text-muted-foreground">Trending #{launch.trendingRank}</span>
        ) : null}
      </div>

      <MarketMetricsRow
        className="mt-3"
        metrics={[
          { label: "Price", value: formatUsd(launch.priceUsd) },
          {
            label: "Volume since launch",
            value: formatUsd(launch.volumeSinceLaunch, { compact: true }),
          },
          { label: "Liquidity", value: formatUsd(launch.liquidityUsd, { compact: true }) },
        ]}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-muted-foreground">
          Buys {launch.buys ?? "—"} · Sells {launch.sells ?? "—"}
        </span>
        <span className={changeClass(launch.priceChange1h)}>
          {formatPercent(launch.priceChange1h)} (1h)
        </span>
      </div>

      {launch.riskFlags.length > 0 ? <RiskFlags flags={launch.riskFlags} className="mt-3" /> : null}
    </article>
  );
}
