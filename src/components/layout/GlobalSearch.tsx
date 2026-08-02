import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { CopyContractButton } from "@/components/feed/CopyContractButton";
import { coinSearchQuery, dexSearchQuery } from "@/lib/market/client";
import { formatUsd, shortenAddress } from "@/lib/market/format";

/**
 * Global search over real provider search endpoints only.
 * Nothing is suggested unless a provider returned it.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const coins = useQuery(coinSearchQuery(debounced));
  const pairs = useQuery(dexSearchQuery(debounced));

  const coinResults = coins.data?.data ?? [];
  const pairResults = (pairs.data?.data ?? []).slice(0, 8);
  const searching = debounced.trim().length > 1;
  const loading = searching && (coins.isFetching || pairs.isFetching);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 gap-2 text-muted-foreground"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Search</span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search coins, tokens or pairs…"
          value={term}
          onValueChange={setTerm}
        />
        <CommandList>
          {!searching ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Type at least two characters to query CoinGecko and DEX Screener.
            </div>
          ) : loading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Searching…</div>
          ) : (
            <CommandEmpty>No markets matched this search.</CommandEmpty>
          )}

          {coinResults.length > 0 ? (
            <CommandGroup heading="Coins · CoinGecko">
              {coinResults.slice(0, 8).map((coin) => (
                <CommandItem
                  key={coin.id}
                  value={`coin-${coin.id}-${coin.name}`}
                  onSelect={() => {
                    setOpen(false);
                    navigate({ to: "/app/coin/$coinId", params: { coinId: coin.id } });
                  }}
                >
                  <span className="font-medium">{coin.name}</span>
                  <span className="ml-2 text-xs uppercase text-muted-foreground">
                    {coin.symbol}
                  </span>
                  {coin.marketCapRank ? (
                    <span className="ml-auto text-xs text-muted-foreground">
                      #{coin.marketCapRank}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {pairResults.length > 0 ? (
            <CommandGroup heading="Pairs · DEX Screener">
              {pairResults.map((pair) => (
                <CommandItem
                  key={`${pair.chainId}-${pair.pairAddress}`}
                  value={`pair-${pair.pairAddress}-${pair.baseToken.symbol ?? ""}`}
                  onSelect={() => {
                    setOpen(false);
                    navigate({
                      to: "/app/token/$chainId/$address",
                      params: { chainId: pair.chainId, address: pair.baseToken.address },
                    });
                  }}
                >
                  <span className="font-medium">
                    {pair.baseToken.symbol ?? shortenAddress(pair.baseToken.address)}
                  </span>
                  {!pair.baseToken.symbol ? (
                    <span onClick={(event) => event.stopPropagation()}>
                      <CopyContractButton address={pair.baseToken.address} className="ml-1" />
                    </span>
                  ) : null}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {pair.chainId}
                    {pair.dexId ? ` · ${pair.dexId}` : ""}
                  </span>
                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                    {formatUsd(pair.priceUsd)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
