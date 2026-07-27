import { cn } from "@/lib/utils";

export function ConfidenceIndicator({
  confidence,
  className,
}: {
  confidence: number;
  className?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, confidence)) * 100);
  const tone =
    pct >= 65 ? "text-positive" : pct >= 35 ? "text-warning-foreground" : "text-muted-foreground";

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted" role="presentation">
        <span
          className={cn(
            "block h-full rounded-full",
            pct >= 65 ? "bg-positive" : pct >= 35 ? "bg-warning" : "bg-muted-foreground",
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className={cn("font-medium tabular-nums", tone)}>{pct}%</span>
    </span>
  );
}

export function RiskLevelBadge({
  level,
  className,
}: {
  level: "low" | "moderate" | "high" | "extreme";
  className?: string;
}) {
  const toneClass: Record<typeof level, string> = {
    low: "bg-muted text-muted-foreground",
    moderate: "bg-warning/15 text-warning-foreground",
    high: "bg-negative/10 text-negative",
    extreme: "bg-negative/20 text-negative",
  };
  const label: Record<typeof level, string> = {
    low: "Low risk",
    moderate: "Moderate risk",
    high: "Elevated risk",
    extreme: "Extreme risk",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
        toneClass[level],
        className,
      )}
    >
      {label[level]}
    </span>
  );
}
