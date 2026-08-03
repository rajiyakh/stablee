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
import type { SupportedChain } from "@/lib/bridge/types";

export function BridgeChainSelect({
  chains,
  value,
  onChange,
  label,
  loading,
}: {
  chains: SupportedChain[];
  value: SupportedChain | null;
  onChange: (chain: SupportedChain) => void;
  label: string;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? chains.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))
    : chains;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={label}
          disabled={loading}
          className="h-9 min-w-[8rem] justify-between gap-1.5 rounded-full px-3 font-normal"
        >
          <span className="truncate">
            {loading ? "Loading…" : (value?.name ?? "Select network")}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search network" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No network matched.</CommandEmpty>
            <CommandGroup>
              {filtered.map((chain) => (
                <CommandItem
                  key={chain.chainId}
                  value={String(chain.chainId)}
                  onSelect={() => {
                    onChange(chain);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="font-medium">{chain.name}</span>
                  {chain.riskNote ? (
                    <span className="ml-auto truncate text-xs text-warning">{chain.riskNote}</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
