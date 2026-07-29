import { Button } from "@/components/ui/button";

const PERCENTAGES = [25, 50, 75, 100] as const;

/** Quick-select row for the Sell amount — fills in a fraction of the spendable wallet balance. */
export function SwapPercentageButtons({
  onSelect,
  disabled,
}: {
  onSelect: (percentage: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-2 flex gap-1.5">
      {PERCENTAGES.map((pct) => (
        <Button
          key={pct}
          type="button"
          variant="outline"
          size="sm"
          className="h-7 flex-1 rounded-full px-2 text-xs"
          disabled={disabled}
          onClick={() => onSelect(pct)}
        >
          {pct === 100 ? "Max" : `${pct}%`}
        </Button>
      ))}
    </div>
  );
}
