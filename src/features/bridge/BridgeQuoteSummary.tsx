import { formatUnits } from "viem";
import { RefreshCw } from "lucide-react";
import {
  BRIDGE_PRICE_IMPACT_MAX_PERCENT,
  BRIDGE_PRICE_IMPACT_WARN_PERCENT,
} from "@/config/bridgePolicy";
import { cn } from "@/lib/utils";
import type { NormalizedBridgeQuote } from "@/lib/bridge/types";

function formatTokenAmount(amount: string, decimals: number, maxDigits = 6): string {
  const value = Number(formatUnits(BigInt(amount || "0"), decimals));
  return value.toLocaleString("en-US", { maximumFractionDigits: maxDigits });
}

function formatSeconds(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)}m`;
}

/**
 * Compact inline preview for the top-ranked route — rate, network cost, minimum
 * received, price impact, and ETA. Distinct from BridgeFeeBreakdown, which stays
 * the full mandatory disclosure rendered inside the confirm dialog before signing.
 */
export function BridgeQuoteSummary({
  quote,
  onRefresh,
  refreshing,
}: {
  quote: NormalizedBridgeQuote;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const { fromToken, toToken } = quote.meta;
  const rate =
    Number(formatUnits(BigInt(quote.estimatedOutputAmount || "0"), toToken.decimals)) /
    Number(formatUnits(BigInt(quote.inputAmount || "0"), fromToken.decimals));
  const impactPercent = quote.priceImpactPercent;
  const impactSevere = impactPercent !== null && impactPercent >= BRIDGE_PRICE_IMPACT_MAX_PERCENT;
  const impactWarn =
    impactPercent !== null && impactPercent >= BRIDGE_PRICE_IMPACT_WARN_PERCENT && !impactSevere;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3 text-sm">
      <div className="flex items-center justify-between">
        <Row
          label="Rate"
          value={`1 ${fromToken.symbol} = ${rate.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${toToken.symbol}`}
        />
        {onRefresh ? (
          <button
            type="button"
            aria-label="Refresh quote"
            onClick={onRefresh}
            disabled={refreshing}
            className="ml-2 shrink-0 rounded-full p-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          </button>
        ) : null}
      </div>
      <Row
        label="Network cost"
        value={quote.gasCostUsd !== null ? `$${quote.gasCostUsd.toFixed(2)}` : "—"}
      />
      <Row
        label="Min. received"
        value={`${formatTokenAmount(quote.minimumReceived, toToken.decimals)} ${toToken.symbol}`}
      />
      <Row
        label="Price impact"
        value={impactPercent !== null ? `${impactPercent.toFixed(2)}%` : "—"}
        tone={impactSevere ? "negative" : impactWarn ? "warning" : "muted"}
      />
      <Row label="Est. time" value={formatSeconds(quote.estimatedTimeSeconds)} />
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "negative" | "warning" | "muted";
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "truncate font-medium tabular-nums",
          tone === "negative" && "text-negative",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </span>
    </div>
  );
}
