import { formatUnits } from "viem";
import { AlertTriangle } from "lucide-react";
import { PRICE_IMPACT_MAX_BPS, PRICE_IMPACT_WARN_BPS, QUOTE_TTL_MS } from "@/config/swapPolicy";
import { detectTokenTax } from "@/lib/swap/tokenTax";
import { humanizeRouteSources } from "@/lib/swap/route";
import { useQuoteAge } from "./hooks/useQuoteAge";
import type { SwapTokenConfig } from "@/config/swapTokens";
import type { SwapPriceData, SwapQuoteData } from "@/lib/swap/client";
import { cn } from "@/lib/utils";

function formatTokenAmount(amount: string | undefined, decimals: number, maxDigits = 6): string {
  if (!amount) return "—";
  const value = Number(formatUnits(BigInt(amount), decimals));
  return value.toLocaleString("en-US", { maximumFractionDigits: maxDigits });
}

/** Price impact is always shown as an unsigned magnitude — never a signed "+/-" change value. */
function formatImpactBps(bps: number | null): string {
  if (bps === null) return "Unavailable";
  return `${(bps / 100).toFixed(2)}%`;
}

export function SwapQuoteDetails({
  sellToken,
  buyToken,
  quote,
  fetchedAt,
  slippageBps,
}: {
  sellToken: SwapTokenConfig;
  buyToken: SwapTokenConfig;
  quote: SwapPriceData | SwapQuoteData;
  fetchedAt: number;
  /** null means Auto — 0x selects an appropriate tolerance for the pair. */
  slippageBps: number | null;
}) {
  const ageMs = useQuoteAge(fetchedAt);
  const remainingMs = Math.max(0, QUOTE_TTL_MS - ageMs);
  const expired = remainingMs <= 0;

  if (!quote.liquidityAvailable) {
    return (
      <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
        No liquidity is available for this pair.
      </p>
    );
  }

  const rate =
    Number(formatUnits(BigInt(quote.buyAmount), buyToken.decimals)) /
    Number(formatUnits(BigInt(quote.sellAmount), sellToken.decimals));
  const impactBps = quote.priceImpactBps;
  const impactSevere = impactBps !== null && impactBps >= PRICE_IMPACT_MAX_BPS;
  const impactWarn = impactBps !== null && impactBps >= PRICE_IMPACT_WARN_BPS && !impactSevere;
  const networkFeeWei = quote.totalNetworkFee;
  const tax = detectTokenTax(quote);
  const route = humanizeRouteSources("route" in quote ? quote.route : undefined);

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3 text-sm">
      <Row
        label="Rate"
        value={`1 ${sellToken.symbol} = ${rate.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${buyToken.symbol}`}
      />
      {route ? <Row label="Route" value={route} /> : null}
      <Row
        label="Minimum received"
        value={
          "minBuyAmount" in quote && quote.minBuyAmount
            ? `${formatTokenAmount(quote.minBuyAmount, buyToken.decimals)} ${buyToken.symbol}`
            : "—"
        }
      />
      <Row
        label="Price impact"
        value={formatImpactBps(impactBps)}
        tone={impactSevere ? "negative" : impactWarn ? "warning" : "muted"}
      />
      <Row
        label="Network fee"
        value={networkFeeWei ? `${formatUnits(BigInt(networkFeeWei), 18)} ETH` : "—"}
      />
      <Row
        label="Slippage tolerance"
        value={slippageBps === null ? "Auto" : `${(slippageBps / 100).toFixed(2)}%`}
      />

      <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
        <span>Quote expiry</span>
        <span className={cn(expired && "font-medium text-negative")}>
          {expired ? "Expired — request a new quote" : `${Math.ceil(remainingMs / 1000)}s`}
        </span>
      </div>

      {impactSevere ? (
        <p className="flex items-start gap-1.5 rounded-lg bg-negative/10 p-2 text-xs text-negative">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Price impact is {formatImpactBps(impactBps)}, above the{" "}
          {(PRICE_IMPACT_MAX_BPS / 100).toFixed(0)}% safety threshold. This swap is blocked by
          default.
        </p>
      ) : null}

      {tax?.hasTax ? (
        <p className="flex items-start gap-1.5 rounded-lg bg-warning/10 p-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          This token reports a transfer/buy/sell tax of up to {(tax.maxBps / 100).toFixed(2)}%,
          detected by the provider. You may receive less than the estimated amount.
        </p>
      ) : null}
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
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium tabular-nums",
          tone === "negative" && "text-negative",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </span>
    </div>
  );
}
