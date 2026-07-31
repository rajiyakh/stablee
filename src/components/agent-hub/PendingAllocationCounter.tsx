import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePendingAllocationTicker } from "@/hooks/usePendingAllocationTicker";
import { calculatePendingAllocation } from "@/lib/agent-hub/calculatePendingAllocation";
import { computeElapsedActiveSeconds } from "@/lib/agent-hub/computeElapsedActiveSeconds";
import type { OwnedAgentPosition } from "@/lib/agent-hub/types";

export function PendingAllocationCounter({
  position,
  dailyRate,
}: {
  position: Pick<OwnedAgentPosition, "activatedAt" | "lastClaimedAt" | "status">;
  dailyRate: string;
}) {
  const now = usePendingAllocationTicker();
  const elapsedSeconds = computeElapsedActiveSeconds(position, now);
  const pending = calculatePendingAllocation(elapsedSeconds, dailyRate);

  return (
    <div className="flex items-center gap-1.5" aria-live="polite">
      <span className="tabular-nums text-sm font-semibold text-foreground">
        {Number(pending).toLocaleString(undefined, { maximumFractionDigits: 4 })} $ORCA
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" aria-label="About this estimate" className="text-muted-foreground">
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">
          Estimated from the latest trusted farming snapshot. Final claimable allocation is
          determined by the official claim system.
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
