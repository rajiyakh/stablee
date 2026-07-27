import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/market/format";
import type { CallTimelineStage } from "@/lib/calls/types";

const stageLabel: Record<CallTimelineStage, string> = {
  detected: "Detected",
  published: "Published",
  entry_triggered: "Entry Triggered",
  updated: "Updated",
  target_reached: "Target Reached",
  invalidated: "Invalidated",
  expired: "Expired",
  scored: "Scored",
};

export function CallTimeline({
  timeline,
}: {
  timeline: Array<{ stage: CallTimelineStage; at: string }>;
}) {
  if (timeline.length === 0) return null;

  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {timeline.map((entry, index) => (
        <li key={`${entry.stage}-${entry.at}`} className="flex items-center gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              index === timeline.length - 1
                ? "bg-primary/12 text-primary"
                : "bg-muted text-muted-foreground",
            )}
            title={formatTimestamp(entry.at)}
          >
            <Check className="h-2.5 w-2.5" aria-hidden="true" />
            {stageLabel[entry.stage]}
          </span>
          {index < timeline.length - 1 ? (
            <span className="text-muted-foreground" aria-hidden="true">
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
