import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SwapTokenConfig } from "@/config/swapTokens";

const DECIMAL_INPUT_RE = /^\d*\.?\d*$/;

export function SwapAmountInput({
  label,
  token,
  value,
  onChange,
  balanceFormatted,
  onMax,
  readOnly,
}: {
  label: string;
  token: SwapTokenConfig | null;
  value: string;
  onChange?: (value: string) => void;
  balanceFormatted?: string | null;
  onMax?: () => void;
  readOnly?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {balanceFormatted !== undefined && balanceFormatted !== null ? (
          <span className="flex items-center gap-1.5">
            Balance: {balanceFormatted} {token?.symbol}
            {onMax ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] font-semibold text-brand"
                onClick={onMax}
              >
                MAX
              </Button>
            ) : null}
          </span>
        ) : null}
      </div>
      <Input
        inputMode="decimal"
        placeholder="0.0"
        value={value}
        readOnly={readOnly}
        onChange={(e) => {
          const next = e.target.value;
          if (DECIMAL_INPUT_RE.test(next)) onChange?.(next);
        }}
        className="mt-1 h-10 border-none bg-transparent px-0 text-2xl font-semibold tabular-nums shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
