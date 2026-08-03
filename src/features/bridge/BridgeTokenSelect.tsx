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
import { BRIDGE_NATIVE_SENTINEL } from "@/lib/bridge/types";
import type { SupportedToken } from "@/lib/bridge/types";

/** Wrapped-native + major stablecoin symbols worth surfacing by default — a
 *  provider's raw token list runs to dozens of entries (meme coins, obscure
 *  wrappers), so this narrows the *default* view only. Symbols only, never
 *  addresses — the real address always comes from the already-verified
 *  `tokens` prop, so there's no risk of hardcoding a wrong contract. */
const BRIDGE_DEFAULT_TOKEN_SYMBOLS = [
  "WETH",
  "WBNB",
  "WMATIC",
  "WPOL",
  "USDT",
  "USDC",
  "DAI",
  // Robinhood Chain's own primary stablecoin (see src/config/swapTokens.ts) —
  // confirmed listed as bridgeable via a live token-list check before adding.
  "USDG",
];
const MIN_CURATED_TOKENS = 2;

function isNativeToken(token: SupportedToken): boolean {
  return token.address.toLowerCase() === BRIDGE_NATIVE_SENTINEL.toLowerCase();
}

/** Native gas token + whatever from BRIDGE_DEFAULT_TOKEN_SYMBOLS the provider actually
 *  lists for this chain. Falls back to the full list when too few matches exist, so a
 *  chain with an unusual token set never shows a near-empty picker. */
export function getDefaultBridgeTokens(tokens: SupportedToken[]): SupportedToken[] {
  const native = tokens.filter(isNativeToken);
  const curated = tokens.filter(
    (t) => !isNativeToken(t) && BRIDGE_DEFAULT_TOKEN_SYMBOLS.includes(t.symbol.toUpperCase()),
  );
  const combined = [...native, ...curated];
  return combined.length >= MIN_CURATED_TOKENS ? combined : tokens;
}

/**
 * Chain-scoped token picker, sourced from /api/bridge/tokens. Deliberately
 * has no free-text-to-any-address flow (unlike TokenSelect) — a bridge
 * cannot route a token a provider hasn't listed as supported, so offering
 * one would violate "never fabricate a route". Pasting a contract address
 * still works as a search: it matches against the already-fetched,
 * already-provider-verified token list.
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

  const query = search.trim().toLowerCase();
  const showingDefault = query === "";
  const filtered = showingDefault
    ? getDefaultBridgeTokens(tokens)
    : tokens.filter(
        (t) =>
          t.symbol.toLowerCase().includes(query) ||
          t.name.toLowerCase().includes(query) ||
          t.address.toLowerCase().includes(query),
      );

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
          <span className="flex min-w-0 items-center gap-1.5">
            {value?.logoUrl ? (
              <img
                src={value.logoUrl}
                alt=""
                className="size-4 shrink-0 rounded-full"
                loading="lazy"
              />
            ) : null}
            <span className="truncate font-medium">
              {loading ? "Loading…" : (value?.symbol ?? "Select")}
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search name, symbol, or address"
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
                  {token.logoUrl ? (
                    <img
                      src={token.logoUrl}
                      alt=""
                      className="size-5 shrink-0 rounded-full"
                      loading="lazy"
                    />
                  ) : null}
                  <span className="shrink-0 font-medium">{token.symbol}</span>
                  <span className="min-w-0 truncate text-xs text-muted-foreground">
                    {token.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {showingDefault && filtered.length < tokens.length ? (
            <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
              Showing key tokens — search by name, symbol, or address for more.
            </p>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
