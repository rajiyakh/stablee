import { cn } from "@/lib/utils";
import type { OwnedAgentPositionStatus } from "@/lib/agent-hub/types";

const STATUS_COPY: Record<OwnedAgentPositionStatus, string> = {
  preview: "Preview",
  "pending-activation": "Pending Activation",
  farming: "Farming",
  paused: "Paused",
  claimable: "Claimable",
  claimed: "Claimed",
};

const STATUS_CLASSES: Record<OwnedAgentPositionStatus, string> = {
  preview: "bg-muted text-muted-foreground",
  "pending-activation": "bg-muted text-muted-foreground",
  farming: "bg-positive/10 text-positive",
  paused: "bg-warning/15 text-warning-foreground",
  claimable: "bg-brand/20 text-foreground",
  claimed: "bg-muted text-muted-foreground",
};

export function FarmingStatusBadge({
  status,
  className,
}: {
  status: OwnedAgentPositionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {status === "farming" ? (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-positive" />
        </span>
      ) : null}
      {STATUS_COPY[status]}
    </span>
  );
}
