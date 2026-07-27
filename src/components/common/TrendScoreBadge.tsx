import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function TrendScoreBadge({
  score,
  reasons,
  className,
}: {
  score: number;
  reasons?: string[];
  className?: string;
}) {
  const tone =
    score >= 70
      ? "bg-primary/12 text-primary"
      : score >= 40
        ? "bg-brand/15 text-brand-foreground"
        : "bg-muted text-muted-foreground";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
            tone,
            className,
          )}
        >
          {score.toFixed(1)}
          <Info className="h-3 w-3 opacity-70" aria-hidden="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-medium">Trend score {score.toFixed(1)} / 100</p>
        <p className="mt-1 text-xs opacity-80">
          Computed from real volume, liquidity, transaction and momentum data. Promotional boosts
          are excluded from the score.
        </p>
        {reasons?.length ? (
          <ul className="mt-2 space-y-0.5 text-xs opacity-90">
            {reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
