import { formatUnits } from "viem";
import { cn } from "@/lib/utils";
import type { NormalizedBridgeQuote } from "@/lib/bridge/types";

function formatAmount(amount: string, decimals: number, symbol: string): string {
  const value = Number(formatUnits(BigInt(amount || "0"), decimals));
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${symbol}`;
}

function formatUsd(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatSeconds(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}

/**
 * The mandatory fee breakdown — rendered in this exact order in both the
 * route card (collapsed) and the confirm dialog (full), from this one
 * component, so the two can never show different numbers:
 * Input Amount, Bridge Provider Fee, Estimated Gas, RobinPulse Platform
 * Fee (shown literally as "1.00%"), Minimum Received, Estimated Time,
 * Selected Route.
 */
export function BridgeFeeBreakdown({
  quote,
  feeBps,
  compact = false,
}: {
  quote: NormalizedBridgeQuote;
  feeBps: number;
  compact?: boolean;
}) {
  const { fromToken, toToken } = quote.meta;
  const providerName = quote.meta.steps[0]?.toolName || quote.provider;

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-border bg-muted/20 text-sm",
        compact ? "p-3" : "p-4",
      )}
    >
      <Row
        label="Input Amount"
        value={formatAmount(quote.inputAmount, fromToken.decimals, fromToken.symbol)}
      />
      <Row
        label="Bridge Provider Fee"
        value={formatAmount(quote.providerFeeAmount, fromToken.decimals, fromToken.symbol)}
      />
      <Row label="Estimated Gas" value={formatUsd(quote.gasCostUsd)} />
      <Row
        label="RobinPulse Platform Fee"
        value={`${formatAmount(quote.platformFeeAmount, fromToken.decimals, fromToken.symbol)} · ${(feeBps / 100).toFixed(2)}%`}
        emphasize
      />
      <Row
        label="Minimum Received"
        value={formatAmount(quote.minimumReceived, toToken.decimals, toToken.symbol)}
      />
      <Row label="Estimated Time" value={formatSeconds(quote.estimatedTimeSeconds)} />
      <Row label="Selected Route" value={providerName} />
    </div>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right font-medium tabular-nums", emphasize && "text-foreground")}>
        {value}
      </span>
    </div>
  );
}
