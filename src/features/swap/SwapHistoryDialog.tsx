import { ExternalLink, History as HistoryIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/EmptyState";
import { robinhoodChain } from "@/config/robinhoodChain";
import { relativeTime } from "@/lib/market/format";
import type { SwapHistoryEntry } from "./hooks/useSwapHistory";

export function SwapHistoryDialog({
  open,
  onOpenChange,
  history,
  isConnected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: SwapHistoryEntry[];
  isConnected: boolean;
}) {
  const explorerUrl = robinhoodChain?.blockExplorers?.default.url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Swap history</DialogTitle>
          <DialogDescription>
            Swaps you've made through RobinPulse on this device.
          </DialogDescription>
        </DialogHeader>

        {!isConnected ? (
          <EmptyState
            icon={<HistoryIcon className="size-8" aria-hidden="true" />}
            title="Wallet not connected"
            description="Connect your wallet to see your swap history."
          />
        ) : history.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon className="size-8" aria-hidden="true" />}
            title="No swaps yet"
            description="Swaps you complete through RobinPulse will show up here."
          />
        ) : (
          <ul className="max-h-96 space-y-2 overflow-y-auto">
            {history.map((entry) => (
              <li
                key={entry.hash}
                className="rounded-lg border border-border bg-muted/30 p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {entry.sellAmount} {entry.sellSymbol} → {entry.buyAmount} {entry.buySymbol}
                  </span>
                  {entry.status === "reverted" ? (
                    <span className="shrink-0 rounded-full bg-negative/10 px-2 py-0.5 text-[11px] font-semibold text-negative">
                      Failed
                    </span>
                  ) : null}
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{relativeTime(entry.timestamp)}</span>
                  {explorerUrl ? (
                    <a
                      href={`${explorerUrl}/tx/${entry.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline"
                    >
                      View on Blockscout <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
