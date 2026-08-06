import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BridgeTransactionStatus } from "@/lib/bridge/types";

const STATE_LABEL: Record<BridgeTransactionStatus["state"], string> = {
  fetching_quote: "Fetching Quote",
  approval_required: "Approval Required",
  waiting_for_signature: "Waiting for Signature",
  submitted: "Submitted",
  bridging: "Bridging",
  destination_pending: "Destination Pending",
  completed: "Completed",
  failed: "Failed",
  refund_required: "Refund Required",
  refunded: "Refunded",
};

const TERMINAL_TONE: Record<string, string> = {
  completed: "text-positive",
  failed: "text-negative",
  refund_required: "text-warning",
  refunded: "text-warning",
};

const IN_PROGRESS_STATES = new Set([
  "fetching_quote",
  "approval_required",
  "waiting_for_signature",
  "submitted",
  "bridging",
  "destination_pending",
]);

export function BridgeStatusPanel({ status }: { status: BridgeTransactionStatus }) {
  const tone = TERMINAL_TONE[status.state] ?? "text-foreground";
  const inProgress = IN_PROGRESS_STATES.has(status.state);
  const label = STATE_LABEL[status.state] ?? "Processing";

  return (
    <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-4 text-sm">
      <div className="flex items-center gap-2">
        {inProgress ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
        <span className={cn("font-display text-base font-semibold", tone)}>{label}</span>
      </div>
      {status.substatusMessage ? (
        <p className="mt-1 text-xs text-muted-foreground">{status.substatusMessage}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {status.sourceExplorerUrl ? (
          <a
            href={status.sourceExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Source transaction <ExternalLink className="size-3" />
          </a>
        ) : null}
        {status.destinationExplorerUrl ? (
          <a
            href={status.destinationExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Destination transaction <ExternalLink className="size-3" />
          </a>
        ) : null}
        {status.providerTrackingUrl ? (
          <a
            href={status.providerTrackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Provider tracking <ExternalLink className="size-3" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
