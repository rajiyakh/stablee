import type { GmgnInterval } from "@/types/gmgn";
import { cn } from "@/lib/utils";

const INTERVALS: GmgnInterval[] = ["1m", "5m", "1h", "6h", "24h"];

/**
 * Every interval GMGN supports for Robinhood Mainnet is shown; none are
 * silently substituted. If a given tab can't support a specific interval,
 * pass it in `disabledIntervals` — it renders visibly disabled, not hidden.
 */
export function IntervalSelector({
  value,
  onChange,
  disabledIntervals = [],
}: {
  value: GmgnInterval;
  onChange: (interval: GmgnInterval) => void;
  disabledIntervals?: GmgnInterval[];
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Interval"
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5"
    >
      {INTERVALS.map((interval) => {
        const isDisabled = disabledIntervals.includes(interval);
        const isActive = value === interval;
        return (
          <button
            key={interval}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(interval)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              isDisabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground",
            )}
          >
            {interval}
          </button>
        );
      })}
    </div>
  );
}
