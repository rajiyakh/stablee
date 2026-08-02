import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { CopyContractButton } from "@/components/feed/CopyContractButton";
import { detectTokenTax } from "@/lib/swap/tokenTax";
import { humanizeRouteSources } from "@/lib/swap/route";
import { QUOTE_TTL_MS } from "@/config/swapPolicy";
import { useQuoteAge } from "./hooks/useQuoteAge";
import type { SwapTokenConfig } from "@/config/swapTokens";
import type { SwapQuoteData } from "@/lib/swap/client";

export function SwapConfirmDialog({
  open,
  onOpenChange,
  sellToken,
  buyToken,
  quote,
  fetchedAt,
  slippageBps,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellToken: SwapTokenConfig;
  buyToken: SwapTokenConfig;
  quote: SwapQuoteData;
  /** Epoch ms when this firm quote was fetched — used to disable Confirm once it's stale. */
  fetchedAt: number;
  /** null means Auto — 0x selects an appropriate tolerance for the pair. */
  slippageBps: number | null;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  const ageMs = useQuoteAge(fetchedAt);
  const expired = ageMs > QUOTE_TTL_MS;

  if (!quote.liquidityAvailable) return null;

  const sellAmount = formatUnits(BigInt(quote.sellAmount), sellToken.decimals);
  const buyAmount = formatUnits(BigInt(quote.buyAmount), buyToken.decimals);
  const minReceived = quote.minBuyAmount
    ? formatUnits(BigInt(quote.minBuyAmount), buyToken.decimals)
    : "—";
  const rate = Number(buyAmount) / Number(sellAmount);
  const tax = detectTokenTax(quote);
  const remainingSeconds = Math.max(0, Math.ceil((QUOTE_TTL_MS - ageMs) / 1000));
  const route = humanizeRouteSources(quote.route);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Swap</DialogTitle>
          <DialogDescription>
            Confirm the details below before submitting this transaction to Robinhood Chain.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <dt className="text-muted-foreground">Sell</dt>
          <dd className="text-right font-medium">
            {sellAmount} {sellToken.symbol}
          </dd>

          <dt className="text-muted-foreground">Buy (estimated)</dt>
          <dd className="text-right font-medium">
            {buyAmount} {buyToken.symbol}
          </dd>

          <dt className="text-muted-foreground">Exchange rate</dt>
          <dd className="text-right">
            1 {sellToken.symbol} = {rate.toLocaleString("en-US", { maximumFractionDigits: 6 })}{" "}
            {buyToken.symbol}
          </dd>

          <dt className="text-muted-foreground">Minimum received</dt>
          <dd className="text-right">
            {minReceived} {buyToken.symbol}
          </dd>

          <dt className="text-muted-foreground">Slippage tolerance</dt>
          <dd className="text-right">
            {slippageBps === null ? "Auto" : `${(slippageBps / 100).toFixed(2)}%`}
          </dd>

          {route ? (
            <>
              <dt className="text-muted-foreground">Route</dt>
              <dd className="text-right">{route}</dd>
            </>
          ) : null}

          <dt className="text-muted-foreground">Sell contract</dt>
          <dd className="text-right">
            <CopyContractButton address={sellToken.address} />
          </dd>

          <dt className="text-muted-foreground">Buy contract</dt>
          <dd className="text-right">
            <CopyContractButton address={buyToken.address} />
          </dd>
        </dl>

        {!sellToken.verified || !buyToken.verified ? (
          <p className="rounded-lg border border-warning/40 bg-warning/10 p-2.5 text-xs text-warning">
            One or more selected tokens is unverified. Trade at your own risk — liquidity and safety
            are not guaranteed.
          </p>
        ) : null}

        {tax?.hasTax ? (
          <p className="flex items-start gap-1.5 rounded-lg border border-warning/40 bg-warning/10 p-2.5 text-xs text-warning">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            This token reports a transfer/buy/sell tax of up to {(tax.maxBps / 100).toFixed(2)}%,
            detected by the provider. The amount you receive may be lower than shown above.
          </p>
        ) : null}

        {expired ? (
          <p className="flex items-start gap-1.5 rounded-lg border border-negative/30 bg-negative/10 p-2.5 text-xs text-negative">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            This quote has expired. Close this dialog and request a new quote before confirming.
          </p>
        ) : (
          <p className="text-right text-xs text-muted-foreground">
            Quote expires in {remainingSeconds}s
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting || expired}>
            {isSubmitting ? "Confirming…" : expired ? "Quote expired" : "Confirm Swap"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
