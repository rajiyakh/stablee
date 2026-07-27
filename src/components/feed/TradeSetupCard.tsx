import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/market/format";
import type { AgentTradeSetup } from "@/lib/calls/types";

const directionLabel: Record<AgentTradeSetup["direction"], string> = {
  long: "Potential long scenario",
  short: "Potential short scenario",
  watch: "Watching",
  avoid: "Avoiding",
};

const statusLabel: Record<AgentTradeSetup["status"], string> = {
  watching: "Watching",
  waiting_for_entry: "Waiting for entry",
  active: "Active",
  target_reached: "Target reached",
  invalidated: "Invalidated",
  expired: "Expired",
  cancelled: "Cancelled",
};

export function TradeSetupCard({
  setup,
  className,
}: {
  setup: AgentTradeSetup;
  className?: string;
}) {
  const hasLevels = setup.entryLow !== undefined || setup.targetLow !== undefined;

  return (
    <div className={cn("rounded-lg border border-border/80 bg-secondary/40 p-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">
          {directionLabel[setup.direction]}
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {statusLabel[setup.status]}
        </span>
      </div>

      {hasLevels ? (
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-[10px] uppercase text-muted-foreground">Entry zone</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {setup.entryLow !== undefined && setup.entryHigh !== undefined
                ? `${formatUsd(setup.entryLow)} – ${formatUsd(setup.entryHigh)}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-muted-foreground">Possible target</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {setup.targetLow !== undefined && setup.targetHigh !== undefined
                ? `${formatUsd(setup.targetLow)} – ${formatUsd(setup.targetHigh)}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-muted-foreground">Invalidation</dt>
            <dd className="font-medium tabular-nums text-negative">
              {setup.invalidationPrice !== undefined ? formatUsd(setup.invalidationPrice) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-muted-foreground">Horizon</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {setup.horizonMinutes >= 60
                ? `${Math.round(setup.horizonMinutes / 60)}h`
                : `${setup.horizonMinutes}m`}
            </dd>
          </div>
        </dl>
      ) : null}

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{setup.reasoning}</p>
      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Scenario, not financial advice
      </p>
    </div>
  );
}
