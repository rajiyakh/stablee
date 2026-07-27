import { cn } from "@/lib/utils";
import { changeClass, formatPercent } from "@/lib/market/format";

export function ChangeBadge({
  value,
  className,
  digits = 2,
}: {
  value: number | null | undefined;
  className?: string;
  digits?: number;
}) {
  return (
    <span className={cn("tabular-nums font-medium", changeClass(value), className)}>
      {formatPercent(value, digits)}
    </span>
  );
}
