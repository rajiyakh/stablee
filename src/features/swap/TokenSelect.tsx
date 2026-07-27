import { AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { SwapTokenConfig } from "@/config/swapTokens";

export function TokenSelect({
  tokens,
  value,
  onChange,
  excludeAddress,
  label,
}: {
  tokens: SwapTokenConfig[];
  value: SwapTokenConfig | null;
  onChange: (token: SwapTokenConfig) => void;
  excludeAddress?: string;
  label: string;
}) {
  const options = tokens.filter(
    (t) => !excludeAddress || t.address.toLowerCase() !== excludeAddress.toLowerCase(),
  );

  return (
    <Select
      value={value?.address ?? undefined}
      onValueChange={(address) => {
        const token = tokens.find((t) => t.address === address);
        if (token) onChange(token);
      }}
    >
      <SelectTrigger aria-label={label} className="h-11 w-full min-w-[9rem]">
        <SelectValue placeholder="Select token">
          {value ? (
            <span className="flex items-center gap-2">
              <span className="font-medium">{value.symbol}</span>
              {!value.verified ? (
                <Badge variant="destructive" className="text-[10px]">
                  Unverified
                </Badge>
              ) : null}
            </span>
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((token) => (
          <SelectItem key={token.address} value={token.address}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{token.symbol}</span>
              <span className="text-xs text-muted-foreground">{token.name}</span>
              {!token.verified ? (
                <span className="inline-flex items-center gap-1 text-xs text-warning">
                  <AlertTriangle className="size-3" /> Unverified
                </span>
              ) : null}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
