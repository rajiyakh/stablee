import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BadgeCheck, Check, ChevronDown, Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolveTokenQuery } from "@/lib/swap/client";
import { shortenAddress } from "@/lib/market/format";
import type { SwapTokenConfig } from "@/config/swapTokens";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function TokenSelect({
  tokens,
  value,
  onChange,
  onCustomTokenResolved,
  excludeAddress,
  label,
}: {
  tokens: SwapTokenConfig[];
  value: SwapTokenConfig | null;
  onChange: (token: SwapTokenConfig) => void;
  /** Called (in addition to onChange) when a pasted-address token is confirmed, so the
   * parent can remember it for the session — it isn't in `tokens` until then. */
  onCustomTokenResolved?: (token: SwapTokenConfig) => void;
  excludeAddress?: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [acknowledgedAddress, setAcknowledgedAddress] = useState<string | null>(null);

  const options = tokens.filter(
    (t) => !excludeAddress || t.address.toLowerCase() !== excludeAddress.toLowerCase(),
  );
  const query = search.trim().toLowerCase();
  const filtered = query
    ? options.filter(
        (t) =>
          t.symbol.toLowerCase().includes(query) ||
          t.name.toLowerCase().includes(query) ||
          t.address.toLowerCase() === query,
      )
    : options;

  const looksLikeAddress = EVM_ADDRESS_RE.test(search.trim());
  const alreadyKnown = looksLikeAddress
    ? options.some((t) => t.address.toLowerCase() === query)
    : false;
  const resolveQuery = useQuery(
    resolveTokenQuery(search.trim(), looksLikeAddress && !alreadyKnown),
  );
  const resolved = resolveQuery.data?.data ?? null;

  function selectToken(token: SwapTokenConfig) {
    onChange(token);
    setOpen(false);
    setSearch("");
    setAcknowledgedAddress(null);
  }

  function confirmCustomToken(token: SwapTokenConfig) {
    onCustomTokenResolved?.(token);
    selectToken(token);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearch("");
          setAcknowledgedAddress(null);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={label}
          className="h-9 min-w-[6.5rem] justify-between gap-1.5 rounded-full px-3 font-normal"
        >
          {value ? (
            <span className="flex items-center gap-1.5 overflow-hidden">
              <span className="truncate font-medium">{value.symbol}</span>
              {value.verified ? (
                <BadgeCheck className="size-3.5 shrink-0 text-positive" aria-label="Verified" />
              ) : (
                <Badge variant="destructive" className="text-[10px]">
                  Unverified
                </Badge>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">Select</span>
          )}
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search name, symbol, or paste address"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {looksLikeAddress && !alreadyKnown ? (
              <div className="border-b border-border p-3">
                {resolveQuery.isFetching ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" /> Looking up contract…
                  </p>
                ) : resolved ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 font-medium">{resolved.symbol}</span>
                      <span className="min-w-0 truncate text-xs text-muted-foreground">
                        {resolved.name}
                      </span>
                      {!resolved.verified ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Unverified
                        </Badge>
                      ) : null}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {shortenAddress(resolved.address, 6)} · {resolved.decimals} decimals
                    </p>
                    {!resolved.verified ? (
                      <>
                        <p className="flex items-start gap-1.5 rounded-md bg-warning/10 p-2 text-xs text-warning">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                          Anyone can create a token with any name. This contract has not been
                          verified by RobinPulse — trade at your own risk.
                        </p>
                        {acknowledgedAddress === resolved.address ? (
                          <Button
                            type="button"
                            size="sm"
                            className="w-full"
                            onClick={() => confirmCustomToken(resolved)}
                          >
                            <Check className="size-3.5" /> Add unverified token
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => setAcknowledgedAddress(resolved.address)}
                          >
                            I understand the risk
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={() => confirmCustomToken(resolved)}
                      >
                        Select {resolved.symbol}
                      </Button>
                    )}
                  </div>
                ) : resolveQuery.isFetched ? (
                  <p className="text-sm text-muted-foreground">
                    No ERC-20 token found at this address on Robinhood Chain.
                  </p>
                ) : null}
              </div>
            ) : null}
            {looksLikeAddress ? null : <CommandEmpty>No token matched.</CommandEmpty>}
            <CommandGroup>
              {filtered.map((token) => (
                <CommandItem
                  key={token.address}
                  value={token.address}
                  onSelect={() => selectToken(token)}
                >
                  <div className="flex w-full items-center gap-2">
                    <span className="shrink-0 font-medium">{token.symbol}</span>
                    <span className="min-w-0 truncate text-xs text-muted-foreground">
                      {token.name}
                    </span>
                    {token.verified ? (
                      <BadgeCheck
                        className="ml-auto size-3.5 shrink-0 text-positive"
                        aria-label="Verified"
                      />
                    ) : (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-warning">
                        <AlertTriangle className="size-3" /> Unverified
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
