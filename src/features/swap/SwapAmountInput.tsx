import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SwapTokenConfig } from "@/config/swapTokens";

const DECIMAL_INPUT_RE = /^\d*\.?\d*$/;

export function SwapAmountInput({
  label,
  token,
  value,
  onChange,
  balanceFormatted,
  balanceLoading,
  balanceError,
  onRetryBalance,
  readOnly,
  tokenSelect,
  footer,
}: {
  label: string;
  token: SwapTokenConfig | null;
  value: string;
  onChange?: (value: string) => void;
  balanceFormatted?: string | null;
  /** Wallet is connected and a balance read is in flight — distinct from "not connected". */
  balanceLoading?: boolean;
  /** The balance read failed after wagmi's own retries were exhausted. */
  balanceError?: boolean;
  onRetryBalance?: () => void;
  readOnly?: boolean;
  /** Token picker rendered inline next to the amount, on this same row. */
  tokenSelect?: ReactNode;
  /** Extra content rendered below the input/token row, inside the same card (e.g. percentage quick-select). */
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {balanceFormatted !== undefined && balanceFormatted !== null ? (
          <span className="flex items-center gap-1.5">
            Balance: {balanceFormatted} {token?.symbol}
          </span>
        ) : balanceLoading ? (
          <span className="text-muted-foreground/70">Loading balance…</span>
        ) : balanceError ? (
          <span className="flex items-center gap-1 text-warning">
            Balance unavailable
            {onRetryBalance ? (
              <button
                type="button"
                onClick={onRetryBalance}
                aria-label="Retry loading balance"
                className="inline-flex items-center rounded p-0.5 hover:bg-warning/10"
              >
                <RefreshCw className="size-3" />
              </button>
            ) : null}
          </span>
        ) : null}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <Input
          inputMode="decimal"
          placeholder="0.0"
          value={value}
          readOnly={readOnly}
          onChange={(e) => {
            const next = e.target.value;
            if (DECIMAL_INPUT_RE.test(next)) onChange?.(next);
          }}
          className="h-10 min-w-0 flex-1 border-none bg-transparent px-0 text-2xl font-semibold tabular-nums shadow-none focus-visible:ring-0"
        />
        {tokenSelect ? <div className="shrink-0">{tokenSelect}</div> : null}
      </div>
      {footer}
    </div>
  );
}
