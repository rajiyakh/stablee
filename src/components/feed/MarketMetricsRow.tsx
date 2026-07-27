import { cn } from "@/lib/utils";

export function MarketMetricsRow({
  metrics,
  className,
}: {
  metrics: Array<{ label: string; value: string }>;
  className?: string;
}) {
  if (metrics.length === 0) return null;
  return (
    <dl className={cn("grid grid-cols-3 gap-2", className)}>
      {metrics.map((m) => (
        <div key={m.label}>
          <dt className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {m.label}
          </dt>
          <dd className="mt-0.5 text-xs font-semibold tabular-nums text-foreground">{m.value}</dd>
        </div>
      ))}
    </dl>
  );
}
