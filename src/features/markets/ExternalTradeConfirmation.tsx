import { AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCompactUsd, shortenAddress } from "@/lib/market/format";
import type { TradingDestination } from "@/config/tradingDestinations";
import type { RobinhoodTrendingToken } from "@/types/gmgn";

export function ExternalTradeConfirmation({
  open,
  onOpenChange,
  token,
  destination,
  url,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: RobinhoodTrendingToken;
  destination: TradingDestination;
  url: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            Leaving RobinPulse AI
          </DialogTitle>
          <DialogDescription>
            You are leaving RobinPulse AI and opening a third-party trading interface. Verify the
            token contract, network, liquidity, price impact, and slippage before connecting a
            wallet or submitting a transaction.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <dt className="text-muted-foreground">Token</dt>
          <dd className="text-right font-medium">{token.symbol}</dd>

          <dt className="text-muted-foreground">Contract</dt>
          <dd className="text-right font-mono text-xs">{shortenAddress(token.address, 5)}</dd>

          <dt className="text-muted-foreground">Network</dt>
          <dd className="text-right">Robinhood Chain</dd>

          <dt className="text-muted-foreground">Destination</dt>
          <dd className="text-right">{destination.label}</dd>

          <dt className="text-muted-foreground">Liquidity</dt>
          <dd className="text-right">{formatCompactUsd(token.liquidityUsd)}</dd>

          <dt className="text-muted-foreground">Market cap</dt>
          <dd className="text-right">{formatCompactUsd(token.marketCapUsd)}</dd>

          <dt className="text-muted-foreground">Verification</dt>
          <dd className="text-right">
            {token.security?.honeypot
              ? "Honeypot flagged"
              : token.security?.renounced
                ? "Mint/freeze renounced"
                : "Unavailable"}
          </dd>
        </dl>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button asChild onClick={() => onOpenChange(false)}>
            <a href={url} target="_blank" rel="noopener noreferrer" className="gap-1.5">
              Continue to Trading Interface
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
