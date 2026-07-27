import type { RobinhoodTrendingToken } from "@/types/gmgn";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Searches only the Robinhood GMGN dataset already loaded client-side —
 * never falls back to CoinGecko or any other chain's results. A pasted
 * full EVM address is matched exactly; anything else is a substring match
 * against name/symbol/address/pair address.
 */
export function matchesRobinhoodSearch(token: RobinhoodTrendingToken, rawQuery: string): boolean {
  const query = rawQuery.trim();
  if (!query) return true;

  if (EVM_ADDRESS_RE.test(query)) {
    return token.address.toLowerCase() === query.toLowerCase();
  }

  const q = query.toLowerCase();
  return (
    token.name.toLowerCase().includes(q) ||
    token.symbol.toLowerCase().includes(q) ||
    token.address.toLowerCase().includes(q) ||
    (token.pairAddress?.toLowerCase().includes(q) ?? false)
  );
}
