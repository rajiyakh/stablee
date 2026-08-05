import { useState } from "react";
import { formatUnits } from "viem";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BridgeRouteDetailsDialog } from "./BridgeRouteDetailsDialog";
import type { NormalizedBridgeQuote } from "@/lib/bridge/types";

function formatAmount(amount: string, decimals: number, symbol: string): string {
  const value = Number(formatUnits(BigInt(amount || "0"), decimals));
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${symbol}`;
}

function formatSeconds(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)}m`;
}

export function BridgeRouteCard({
  quote,
  highlight,
  selected,
  onSelect,
}: {
  quote: NormalizedBridgeQuote;
  /** "Best Return" / "Fastest" / "Lowest Cost" badge for the top pick of the active sort. */
  highlight?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { fromToken, toToken } = quote.meta;
  const totalFees = BigInt(quote.providerFeeAmount || "0") + BigInt(quote.platformFeeAmount || "0");

  return (
    <div
      className={cn(
        "rounded-xl border bg-card backdrop-blur-sm p-4 transition-colors",
        selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40",
      )}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={onSelect}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-semibold text-foreground">
              {quote.meta.steps[0]?.toolName || quote.provider}
            </span>
            {highlight ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                {highlight}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {formatAmount(quote.estimatedOutputAmount, toToken.decimals, toToken.symbol)}
          </p>
        </div>
        <span className="mt-1 text-xs text-muted-foreground">
          {formatSeconds(quote.estimatedTimeSeconds)}
        </span>
      </button>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <dt>Total Fees</dt>
          <dd className="tabular-nums text-foreground">
            {formatAmount(totalFees.toString(), fromToken.decimals, fromToken.symbol)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Gas Cost</dt>
          <dd className="tabular-nums text-foreground">
            {quote.gasCostUsd !== null ? `$${quote.gasCostUsd.toFixed(2)}` : "—"}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Price Impact</dt>
          <dd className="tabular-nums text-foreground">
            {quote.priceImpactPercent !== null ? `${quote.priceImpactPercent.toFixed(2)}%` : "—"}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Provider</dt>
          <dd className="text-foreground">{quote.provider}</dd>
        </div>
      </dl>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 h-7 gap-1 px-1.5 text-xs text-muted-foreground"
        onClick={() => setDetailsOpen(true)}
      >
        View Route Details <ChevronRight className="size-3" />
      </Button>

      <BridgeRouteDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} quote={quote} />
    </div>
  );
}
