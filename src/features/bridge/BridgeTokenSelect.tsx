import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
import type { SupportedToken } from "@/lib/bridge/types";

/**
 * Chain-scoped token picker, sourced from /api/bridge/tokens. Deliberately
 * has no paste-an-arbitrary-address flow (unlike TokenSelect) — a bridge
 * cannot route a token a provider hasn't listed as supported, so offering
 * one would violate "never fabricate a route".
 */
export function BridgeTokenSelect({
  tokens,
  value,
  onChange,
  label,
  loading,
}: {
  tokens: SupportedToken[];
  value: SupportedToken | null;
  onChange: (token: SupportedToken) => void;
  label: string;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? tokens.filter(
        (t) =>
          t.symbol.toLowerCase().includes(search.trim().toLowerCase()) ||
          t.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : tokens;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={label}
          disabled={loading}
          className="h-9 min-w-[6.5rem] justify-between gap-1.5 rounded-full px-3 font-normal"
        >
          <span className="truncate font-medium">
            {loading ? "Loading…" : (value?.symbol ?? "Select")}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search name or symbol"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {tokens.length === 0
                ? "No tokens available on this network for the enabled providers."
                : "No token matched."}
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((token) => (
                <CommandItem
                  key={token.address}
                  value={token.address}
                  onSelect={() => {
                    onChange(token);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="shrink-0 font-medium">{token.symbol}</span>
                  <span className="min-w-0 truncate text-xs text-muted-foreground">
                    {token.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
