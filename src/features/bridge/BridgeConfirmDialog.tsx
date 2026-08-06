import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BRIDGE_QUOTE_TTL_MS } from "@/config/bridgePolicy";
import { BridgeFeeBreakdown } from "./BridgeFeeBreakdown";
import { useQuoteAge } from "@/features/swap/hooks/useQuoteAge";
import type { NormalizedBridgeQuote } from "@/lib/bridge/types";

const PROVIDER_HOMEPAGE: Record<string, string> = {
  lifi: "https://jumper.exchange",
  relay: "https://relay.link",
  across: "https://across.to",
  gaszip: "https://gas.zip",
};

const LEGAL_COPY =
  "Cross-chain transfers involve smart-contract, liquidity, execution and network risks. Quotes may change before execution. RobinPulse charges a transparent 1% platform fee, shown in the transaction breakdown.";

export function BridgeConfirmDialog({
  open,
  onOpenChange,
  quote,
  feeBps,
  isCustomRecipient,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: NormalizedBridgeQuote;
  feeBps: number;
  isCustomRecipient: boolean;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  // This dialog stays mounted across route reselection (BridgePage.tsx keeps
  // it in the tree whenever selectedQuote is set), so without this the fee
  // acknowledgement for one quote would silently carry over to a different
  // quote the user selects afterward.
  useEffect(() => {
    setAcknowledged(false);
  }, [quote.provider, quote.routeId]);

  const ageMs = useQuoteAge(quote.meta.fetchedAt);
  const expired = Date.now() > quote.meta.expiresAt;
  const remainingSeconds = Math.max(
    0,
    Math.ceil((quote.meta.expiresAt - quote.meta.fetchedAt - ageMs) / 1000),
  );

  const providerHomepage = PROVIDER_HOMEPAGE[quote.provider];
  const canConfirm = acknowledged && !expired && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Bridge</DialogTitle>
          <DialogDescription>
            Confirm the complete fee breakdown below before submitting this transaction.
          </DialogDescription>
        </DialogHeader>

        <BridgeFeeBreakdown quote={quote} feeBps={feeBps} />

        <p className="rounded-lg border border-border bg-muted/20 p-2.5 text-xs text-muted-foreground">
          {LEGAL_COPY}
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Terms <ExternalLink className="size-3" />
          </a>
          <a
            href="/app/disclaimer"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Risk Disclosure <ExternalLink className="size-3" />
          </a>
          {providerHomepage ? (
            <a
              href={providerHomepage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Bridge Provider <ExternalLink className="size-3" />
            </a>
          ) : null}
          {quote.meta.trackingUrl ? (
            <a
              href={quote.meta.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Transaction Status <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>

        {isCustomRecipient ? (
          <p className="rounded-lg border border-warning/40 bg-warning/10 p-2.5 text-xs text-warning">
            You're sending to a custom recipient address. This transfer cannot be reversed or
            refunded once confirmed.
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          <Checkbox
            id="bridge-fee-ack"
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(checked === true)}
          />
          <Label htmlFor="bridge-fee-ack" className="text-xs font-normal">
            I've reviewed the fee breakdown, including the RobinPulse Platform Fee (
            {(feeBps / 100).toFixed(2)}%), and understand this transfer may not be refundable.
          </Label>
        </div>

        {expired ? (
          <p className="text-right text-xs font-medium text-negative">
            This quote has expired. Close this dialog and request a new quote.
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
          <Button onClick={onConfirm} disabled={!canConfirm}>
            {isSubmitting ? "Confirming…" : expired ? "Quote expired" : "Confirm Bridge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
