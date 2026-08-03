import { formatUnits } from "viem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NormalizedBridgeQuote } from "@/lib/bridge/types";

function formatStepAmount(amount: string, decimals: number, symbol: string): string {
  const value = Number(formatUnits(BigInt(amount || "0"), decimals));
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${symbol}`;
}

/** Every bridge/swap step this route actually executes, in order — the provider's own breakdown, never invented. */
export function BridgeRouteDetailsDialog({
  open,
  onOpenChange,
  quote,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: NormalizedBridgeQuote;
}) {
  const steps = quote.meta.steps;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Route details</DialogTitle>
          <DialogDescription>
            Every step this route executes, via {quote.provider}.
          </DialogDescription>
        </DialogHeader>

        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This provider didn't return a step-by-step breakdown for this route.
          </p>
        ) : (
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li
                key={`${step.toolName}-${index}`}
                className="rounded-lg border border-border p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize text-foreground">
                    {index + 1}. {step.type} via {step.toolName}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatStepAmount(
                    step.fromAmount,
                    step.fromToken.decimals,
                    step.fromToken.symbol,
                  )}{" "}
                  → {formatStepAmount(step.toAmount, step.toToken.decimals, step.toToken.symbol)}
                </p>
              </li>
            ))}
          </ol>
        )}

        {quote.meta.providerRiskNotes.length > 0 ? (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
            {quote.meta.providerRiskNotes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
