import { useState } from "react";
import { Settings2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SLIPPAGE_MAX_BPS, SLIPPAGE_PRESETS_BPS, SLIPPAGE_WARN_BPS } from "@/config/swapPolicy";
import { cn } from "@/lib/utils";

function bpsToPercentInput(bps: number): string {
  return (bps / 100).toString();
}

/** Uniswap-style slippage tolerance control: presets + a custom value, clamped to the same SLIPPAGE_MAX_BPS the server enforces. */
export function SlippageControl({
  slippageBps,
  onChange,
}: {
  slippageBps: number;
  onChange: (bps: number) => void;
}) {
  const isPreset = (SLIPPAGE_PRESETS_BPS as readonly number[]).includes(slippageBps);
  const [customInput, setCustomInput] = useState(isPreset ? "" : bpsToPercentInput(slippageBps));
  const [customError, setCustomError] = useState<string | null>(null);

  function applyCustom(raw: string) {
    setCustomInput(raw);
    if (raw.trim() === "") {
      setCustomError(null);
      return;
    }
    const percent = Number(raw);
    if (!Number.isFinite(percent) || percent <= 0) {
      setCustomError("Enter a value above 0%");
      return;
    }
    const bps = Math.round(percent * 100);
    if (bps > SLIPPAGE_MAX_BPS) {
      setCustomError(`Max slippage is ${(SLIPPAGE_MAX_BPS / 100).toFixed(1)}%`);
      return;
    }
    setCustomError(null);
    onChange(bps);
  }

  const warnHigh = slippageBps >= SLIPPAGE_WARN_BPS;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-8 gap-1.5 px-2.5 text-xs", warnHigh && "border-warning text-warning")}
        >
          <Settings2 className="size-3.5" />
          {(slippageBps / 100).toFixed(2)}%
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Slippage tolerance</p>
        <div className="flex gap-1.5">
          {SLIPPAGE_PRESETS_BPS.map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant={slippageBps === preset ? "default" : "outline"}
              className="h-7 flex-1 px-0 text-xs"
              onClick={() => {
                setCustomInput("");
                setCustomError(null);
                onChange(preset);
              }}
            >
              {(preset / 100).toFixed(1)}%
            </Button>
          ))}
        </div>
        <div className="relative">
          <Input
            inputMode="decimal"
            placeholder="Custom"
            value={customInput}
            onChange={(e) => applyCustom(e.target.value)}
            className="h-8 pr-7 text-xs"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            %
          </span>
        </div>
        {customError ? (
          <p className="flex items-start gap-1 text-xs text-negative">
            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
            {customError}
          </p>
        ) : warnHigh ? (
          <p className="flex items-start gap-1 text-xs text-warning">
            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
            High slippage — your transaction may be frontrun for a worse price.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
