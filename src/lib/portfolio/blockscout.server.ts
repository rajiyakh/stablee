import { fetchJson, type FetchResult } from "@/lib/market/http.server";
import { robinhoodChainFacts } from "@/config/robinhoodChain";

/**
 * Raw Blockscout v2 API shapes — only the fields this app actually reads.
 * Confirmed live against robinhoodchain.blockscout.com before building this
 * (see docs/PORTFOLIO_SETUP.md): /addresses/{address} for the native coin
 * balance + its USD price, /addresses/{address}/token-balances for every
 * ERC-20 the address holds, each already carrying its own live USD price —
 * no separate price-resolution step needed, unlike the swap feature's
 * multi-tier resolveUsdValue().
 */
export interface BlockscoutAddressOverview {
  coin_balance: string | null;
  exchange_rate: string | null;
}

export interface BlockscoutTokenBalance {
  token: {
    address_hash: string;
    name: string | null;
    symbol: string | null;
    decimals: string | null;
    icon_url: string | null;
    exchange_rate: string | null;
    reputation: string | null;
    type: string;
  };
  value: string;
}

function explorerApiBase(): string | null {
  const url = robinhoodChainFacts?.blockExplorers?.default.url;
  return url ? url.replace(/\/+$/, "") : null;
}

export function blockscoutConfigured(): boolean {
  return explorerApiBase() !== null;
}

export function fetchAddressOverview(
  address: string,
): Promise<FetchResult<BlockscoutAddressOverview>> {
  const base = explorerApiBase();
  if (!base) throw new Error("fetchAddressOverview called without a configured explorer URL");
  return fetchJson<BlockscoutAddressOverview>(`${base}/api/v2/addresses/${address}`, {
    provider: "blockscout",
    cacheKey: `blockscout:address:${address.toLowerCase()}`,
    ttlSeconds: 20,
    timeoutMs: 10_000,
    retries: 1,
  });
}

export function fetchAddressTokenBalances(
  address: string,
): Promise<FetchResult<BlockscoutTokenBalance[]>> {
  const base = explorerApiBase();
  if (!base) {
    throw new Error("fetchAddressTokenBalances called without a configured explorer URL");
  }
  return fetchJson<BlockscoutTokenBalance[]>(`${base}/api/v2/addresses/${address}/token-balances`, {
    provider: "blockscout",
    cacheKey: `blockscout:token-balances:${address.toLowerCase()}`,
    // Longer than the overview endpoint's cache — this call can be slow
    // (see timeoutMs below), so a longer TTL avoids paying that cost on
    // every visit within a short window.
    ttlSeconds: 45,
    // Confirmed live: this specific endpoint can genuinely take 20+ seconds
    // for an address with many holdings (Blockscout enumerates its indexed
    // transfer history server-side) — a longer single attempt beats a short
    // timeout + retry, which would just double the wait on an endpoint
    // that's slow-but-working rather than actually failing.
    timeoutMs: 28_000,
    retries: 0,
  });
}
