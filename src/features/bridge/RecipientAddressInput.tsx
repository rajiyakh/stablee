import { useEffect } from "react";
import { isAddress } from "viem";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function RecipientAddressInput({
  value,
  connectedAddress,
  onChange,
  acknowledged,
  onAcknowledgeChange,
  onValidChange,
}: {
  value: string;
  connectedAddress: string | undefined;
  onChange: (value: string) => void;
  acknowledged: boolean;
  onAcknowledgeChange: (checked: boolean) => void;
  /** Reports whether `value` is currently a valid address (or empty) so the
   * parent can block submission on an invalid custom recipient. */
  onValidChange?: (valid: boolean) => void;
}) {
  const isCustom =
    Boolean(connectedAddress) && value.toLowerCase() !== connectedAddress?.toLowerCase();
  const isValid = value === "" || isAddress(value);

  useEffect(() => {
    onValidChange?.(isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Recipient Address</span>
        {connectedAddress ? (
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => onChange(connectedAddress)}
          >
            Use connected wallet
          </button>
        ) : null}
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="0x…"
        className={cnInvalid(!isValid)}
      />
      {!isValid ? <p className="text-xs text-negative">Not a valid address.</p> : null}

      {isCustom ? (
        <div className="space-y-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          <p className="flex items-start gap-1.5">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            This is not your connected wallet. Funds sent to a wrong or non-EVM address are
            unrecoverable — bridge transfers cannot be reversed or refunded once confirmed.
          </p>
          <div className="flex items-center gap-2">
            <Checkbox
              id="bridge-custom-recipient-ack"
              checked={acknowledged}
              onCheckedChange={(checked) => onAcknowledgeChange(checked === true)}
            />
            <Label
              htmlFor="bridge-custom-recipient-ack"
              className="text-xs font-normal text-warning"
            >
              I've verified this address is correct.
            </Label>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function cnInvalid(invalid: boolean): string | undefined {
  return invalid ? "border-negative focus-visible:ring-negative" : undefined;
}
