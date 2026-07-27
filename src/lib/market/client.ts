import { queryOptions } from "@tanstack/react-query";
import type {
  ApiEnvelope,
  ChartPoint,
  CoinMarket,
  DexMarket,
  OhlcvPoint,
  ProviderStatus,
  ScoredMarket,
  TrendingCoin,
} from "./types";
import type { GmgnInterval, RobinhoodHotSearchToken, RobinhoodTrendingToken } from "@/types/gmgn";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function getEnvelope<T>(url: string): Promise<ApiEnvelope<T>> {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError("invalid_response", "The data service returned an unreadable response.");
  }
  if (!response.ok || body.error) {
    throw new ApiError(
      body?.error?.code ?? "request_failed",
      body?.error?.message ?? "Data temporarily unavailable.",
    );
  }
  return body;
}

export const marketKeys = {
  status: ["market", "status"] as const,
  globalTrending: ["market", "coingecko", "trending"] as const,
  coins: (ids: string[]) => ["market", "coingecko", "coins", ids.join(",")] as const,
  coin: (id: string) => ["market", "coingecko", "coin", id] as const,
  chart: (id: string, days: string) => ["market", "coingecko", "chart", id, days] as const,
  cgSearch: (q: string) => ["market", "coingecko", "search", q] as const,
  dsSearch: (q: string) => ["market", "dexscreener", "search", q] as const,
  dsToken: (chainId: string, address: string) =>
    ["market", "dexscreener", "token", chainId, address] as const,
  dsPair: (chainId: string, pairId: string) =>
    ["market", "dexscreener", "pair", chainId, pairId] as const,
  chainTrending: (chainId: string) => ["market", "dexscreener", "trending", chainId] as const,
  gtTrending: (networkId: string) => ["market", "geckoterminal", "trending", networkId] as const,
  gtOhlcv: (networkId: string, poolAddress: string) =>
    ["market", "geckoterminal", "ohlcv", networkId, poolAddress] as const,
  gmgnTrending: (interval: GmgnInterval, limit: number) =>
    ["market", "gmgn", "trending", interval, limit] as const,
  gmgnHotSearches: (interval: GmgnInterval, limit: number) =>
    ["market", "gmgn", "hot-searches", interval, limit] as const,
};

export const statusQuery = () =>
  queryOptions({
    queryKey: marketKeys.status,
    queryFn: async () => {
      const res = await fetch("/api/market/status");
      if (!res.ok) throw new ApiError("status_failed", "Provider status is unavailable.");
      return (await res.json()) as { providers: ProviderStatus[]; generatedAt: string };
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

export const globalTrendingQuery = () =>
  queryOptions({
    queryKey: marketKeys.globalTrending,
    queryFn: () => getEnvelope<TrendingCoin[]>("/api/market/coingecko/trending"),
    staleTime: 120_000,
  });

export const coinsQuery = (ids: string[]) =>
  queryOptions({
    queryKey: marketKeys.coins(ids),
    queryFn: () =>
      getEnvelope<CoinMarket[]>(
        `/api/market/coingecko/coins${ids.length ? `?ids=${encodeURIComponent(ids.join(","))}` : ""}`,
      ),
    staleTime: 45_000,
  });

export interface CoinDetailPayload {
  id: string;
  symbol: string;
  name: string;
  description: string | null;
  image: string | null;
  homepage: string | null;
  platforms: Record<string, string>;
  marketCapRank: number | null;
  price: number | null;
  marketCap: number | null;
  volume24h: number | null;
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  fdv: number | null;
  lastUpdated: string | null;
}

export const coinQuery = (id: string) =>
  queryOptions({
    queryKey: marketKeys.coin(id),
    queryFn: () => getEnvelope<CoinDetailPayload>(`/api/market/coingecko/coin/${id}`),
    staleTime: 60_000,
    enabled: Boolean(id),
  });

export const chartQuery = (id: string, days: string) =>
  queryOptions({
    queryKey: marketKeys.chart(id, days),
    queryFn: () => getEnvelope<ChartPoint[]>(`/api/market/coingecko/chart/${id}?days=${days}`),
    staleTime: 300_000,
    enabled: Boolean(id),
  });

export const coinSearchQuery = (q: string) =>
  queryOptions({
    queryKey: marketKeys.cgSearch(q),
    queryFn: () =>
      getEnvelope<
        Array<{
          id: string;
          name: string;
          symbol: string;
          thumb: string | null;
          marketCapRank: number | null;
        }>
      >(`/api/market/coingecko/search?q=${encodeURIComponent(q)}`),
    staleTime: 120_000,
    enabled: q.trim().length > 1,
  });

export const dexSearchQuery = (q: string) =>
  queryOptions({
    queryKey: marketKeys.dsSearch(q),
    queryFn: () =>
      getEnvelope<DexMarket[]>(`/api/market/dexscreener/search?q=${encodeURIComponent(q)}`),
    staleTime: 45_000,
    enabled: q.trim().length > 1,
  });

export const dexTokenQuery = (chainId: string, address: string) =>
  queryOptions({
    queryKey: marketKeys.dsToken(chainId, address),
    queryFn: () =>
      getEnvelope<DexMarket[]>(
        `/api/market/dexscreener/token/${encodeURIComponent(chainId)}/${encodeURIComponent(address)}`,
      ),
    staleTime: 45_000,
    enabled: Boolean(chainId && address),
  });

export const chainTrendingQuery = (chainId: string) =>
  queryOptions({
    queryKey: marketKeys.chainTrending(chainId),
    queryFn: () =>
      getEnvelope<{ markets: ScoredMarket[]; boosted: string[] }>(
        `/api/market/dexscreener/trending/${encodeURIComponent(chainId)}`,
      ),
    staleTime: 120_000,
    enabled: Boolean(chainId),
  });

export const geckoTrendingQuery = (networkId: string) =>
  queryOptions({
    queryKey: marketKeys.gtTrending(networkId),
    queryFn: () =>
      getEnvelope<ScoredMarket[]>(
        `/api/market/geckoterminal/trending/${encodeURIComponent(networkId)}`,
      ),
    staleTime: 120_000,
    enabled: Boolean(networkId),
  });

export const ohlcvQuery = (networkId: string, poolAddress: string) =>
  queryOptions({
    queryKey: marketKeys.gtOhlcv(networkId, poolAddress),
    queryFn: () =>
      getEnvelope<OhlcvPoint[]>(
        `/api/market/geckoterminal/ohlcv/${encodeURIComponent(networkId)}/${encodeURIComponent(poolAddress)}`,
      ),
    staleTime: 300_000,
    enabled: Boolean(networkId && poolAddress),
  });

/** "not_configured" never resolves by retrying — surface it immediately instead of retrying 3x with backoff. */
const gmgnRetry = (failureCount: number, error: unknown) =>
  error instanceof ApiError && error.code === "not_configured" ? false : failureCount < 1;

export const gmgnTrendingQuery = (interval: GmgnInterval, limit = 100) =>
  queryOptions({
    queryKey: marketKeys.gmgnTrending(interval, limit),
    queryFn: () =>
      getEnvelope<RobinhoodTrendingToken[]>(
        `/api/market/gmgn/trending?interval=${encodeURIComponent(interval)}&limit=${limit}`,
      ),
    staleTime: 30_000,
    retry: gmgnRetry,
  });

export const gmgnHotSearchesQuery = (interval: GmgnInterval, limit = 100) =>
  queryOptions({
    queryKey: marketKeys.gmgnHotSearches(interval, limit),
    queryFn: () =>
      getEnvelope<RobinhoodHotSearchToken[]>(
        `/api/market/gmgn/hot-searches?interval=${encodeURIComponent(interval)}&limit=${limit}`,
      ),
    staleTime: 30_000,
    retry: gmgnRetry,
  });
