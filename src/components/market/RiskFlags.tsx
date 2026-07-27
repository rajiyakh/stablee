import { AlertTriangle } from "lucide-react";
import { RISK_FLAG_LABELS, type RiskFlag } from "@/lib/market/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const severity: Record<RiskFlag, "high" | "medium" | "info"> = {
  low_liquidity: "high",
  extremely_low_liquidity: "high",
  high_volatility: "high",
  suspicious_volume: "high",
  sudden_liquidity_decline: "high",
  new_pair: "medium",
  buy_sell_imbalance: "medium",
  data_provider_disagreement: "medium",
  promotional_boost: "info",
  limited_data: "info",
  incomplete_market_data: "info",
  verification_unavailable: "info",
};

const toneClass = {
  high: "bg-negative/10 text-negative",
  medium: "bg-warning/15 text-warning-foreground",
  info: "bg-muted text-muted-foreground",
} as const;

export function RiskFlags({
  flags,
  className,
  max,
}: {
  flags: RiskFlag[];
  className?: string;
  max?: number;
}) {
  if (!flags.length) return null;
  const shown = max ? flags.slice(0, max) : flags;
  const hidden = flags.length - shown.length;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {shown.map((flag) => (
        <Tooltip key={flag}>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
                toneClass[severity[flag]],
              )}
            >
              {severity[flag] === "high" ? (
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              ) : null}
              {RISK_FLAG_LABELS[flag]}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-xs">
              {RISK_FLAG_LABELS[flag]} — derived from live provider data against the platform's
              published safeguard thresholds.
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
      {hidden > 0 ? <span className="text-[11px] text-muted-foreground">+{hidden}</span> : null}
    </div>
  );
}
