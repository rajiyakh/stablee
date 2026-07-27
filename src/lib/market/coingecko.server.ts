import { z } from "zod";
import { cacheConfig } from "@/config/trending";
import type { ChartPoint, CoinMarket, TrendingCoin } from "./types";
import { fetchJson, type FetchResult } from "./http.server";
import { sanitizeExternalUrl } from "./format";

const BASE = () => process.env.COINGECKO_API_BASE_URL || "https://api.coingecko.com/api/v3";
const KEY = () => process.env.COINGECKO_API_KEY || "";

export const COINGECKO_ATTRIBUTION = "Market data by CoinGecko";

function headers(): Record<string, string> {
  const key = KEY();
  return key ? { "x-cg-demo-api-key": key, "x-cg-pro-api-key": key } : {};
}

export function coinGeckoConfigured(): boolean {
  // The public endpoint works without a key, but at a low rate limit.
  return true;
}

async function cgFetch<T>(path: string, ttl: number, cacheKey: string): Promise<FetchResult<T>> {
  return fetchJson<T>(`${BASE()}${path}`, {
    provider: "coingecko",
    cacheKey: `cg:${cacheKey}`,
    ttlSeconds: ttl,
    headers: headers(),
  });
}

const trendingSchema = z.object({
  coins: z.array(
    z.object({
      item: z.object({
        id: z.string(),
        name: z.string(),
        symbol: z.string(),
        thumb: z.string().nullish(),
        market_cap_rank: z.number().nullish(),
        score: z.number().nullish(),
        data: z
          .object({
            price: z.union([z.number(), z.string()]).nullish(),
            price_change_percentage_24h: z.object({ usd: z.number().nullish() }).nullish(),
          })
          .nullish(),
      }),
    }),
  ),
});

export async function getTrending(): Promise<FetchResult<TrendingCoin[]>> {
  const res = await cgFetch<unknown>(
    "/search/trending",
    cacheConfig.trendingSeconds,
    "search/trending",
  );
  const parsed = trendingSchema.parse(res.data);
  const data: TrendingCoin[] = parsed.coins.map(({ item }) => ({
    id: item.id,
    name: item.name,
    symbol: item.symbol,
    thumb: item.thumb ?? null,
    marketCapRank: item.market_cap_rank ?? null,
    score: item.score ?? null,
    priceUsd:
      typeof item.data?.price === "number"
        ? item.data.price
        : typeof item.data?.price === "string"
          ? Number(item.data.price.replace(/[$,]/g, "")) || null
          : null,
    priceChangePercentage24h: item.data?.price_change_percentage_24h?.usd ?? null,
  }));
  return { ...res, data };
}

const marketsSchema = z.array(
  z.object({
    id: z.string(),
    symbol: z.string(),
    name: z.string(),
    image: z.string().nullish(),
    current_price: z.number().nullish(),
    market_cap: z.number().nullish(),
    market_cap_rank: z.number().nullish(),
    total_volume: z.number().nullish(),
    price_change_percentage_24h: z.number().nullish(),
    last_updated: z.string().nullish(),
  }),
);

function toCoinMarket(raw: z.infer<typeof marketsSchema>[number]): CoinMarket {
  return {
    id: raw.id,
    symbol: raw.symbol,
    name: raw.name,
    image: raw.image ?? null,
    currentPrice: raw.current_price ?? null,
    marketCap: raw.market_cap ?? null,
    marketCapRank: raw.market_cap_rank ?? null,
    totalVolume: raw.total_volume ?? null,
    priceChangePercentage24h: raw.price_change_percentage_24h ?? null,
    lastUpdated: raw.last_updated ?? null,
  };
}

export async function getCoinMarkets(ids: string[]): Promise<FetchResult<CoinMarket[]>> {
  if (!ids.length) {
    return { data: [], fetchedAt: new Date().toISOString(), cached: false, stale: false };
  }
  const joined = ids.map(encodeURIComponent).join(",");
  const res = await cgFetch<unknown>(
    `/coins/markets?vs_currency=usd&ids=${joined}&price_change_percentage=24h`,
    cacheConfig.priceSeconds,
    `markets:${joined}`,
  );
  return { ...res, data: marketsSchema.parse(res.data).map(toCoinMarket) };
}

export async function getTopMarkets(page = 1, perPage = 50): Promise<FetchResult<CoinMarket[]>> {
  const res = await cgFetch<unknown>(
    `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&price_change_percentage=24h`,
    cacheConfig.priceSeconds,
    `top:${page}:${perPage}`,
  );
  return { ...res, data: marketsSchema.parse(res.data).map(toCoinMarket) };
}

const searchSchema = z.object({
  coins: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      symbol: z.string(),
      thumb: z.string().nullish(),
      market_cap_rank: z.number().nullish(),
    }),
  ),
});

export async function search(query: string) {
  const res = await cgFetch<unknown>(
    `/search?query=${encodeURIComponent(query)}`,
    cacheConfig.trendingSeconds,
    `search:${query.toLowerCase()}`,
  );
  const parsed = searchSchema.parse(res.data);
  return {
    ...res,
    data: parsed.coins.slice(0, 25).map((c) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      thumb: c.thumb ?? null,
      marketCapRank: c.market_cap_rank ?? null,
    })),
  };
}

const coinSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  description: z.object({ en: z.string().nullish() }).nullish(),
  image: z.object({ large: z.string().nullish(), small: z.string().nullish() }).nullish(),
  links: z
    .object({
      homepage: z.array(z.string()).nullish(),
      blockchain_site: z.array(z.string()).nullish(),
    })
    .nullish(),
  platforms: z.record(z.string(), z.string().nullish()).nullish(),
  market_cap_rank: z.number().nullish(),
  last_updated: z.string().nullish(),
  market_data: z
    .object({
      current_price: z.object({ usd: z.number().nullish() }).nullish(),
      market_cap: z.object({ usd: z.number().nullish() }).nullish(),
      total_volume: z.object({ usd: z.number().nullish() }).nullish(),
      price_change_percentage_24h: z.number().nullish(),
      price_change_percentage_1h_in_currency: z.object({ usd: z.number().nullish() }).nullish(),
      price_change_percentage_7d: z.number().nullish(),
      fully_diluted_valuation: z.object({ usd: z.number().nullish() }).nullish(),
    })
    .nullish(),
});

export type CoinDetail = {
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
};

export async function getCoin(id: string): Promise<FetchResult<CoinDetail>> {
  const res = await cgFetch<unknown>(
    `/coins/${encodeURIComponent(id)}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`,
    cacheConfig.metadataSeconds,
    `coin:${id}`,
  );
  const c = coinSchema.parse(res.data);
  const platforms: Record<string, string> = {};
  for (const [k, v] of Object.entries(c.platforms ?? {})) if (v) platforms[k] = v;

  return {
    ...res,
    data: {
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      description: c.description?.en?.slice(0, 1200) || null,
      image: c.image?.large ?? c.image?.small ?? null,
      homepage: sanitizeExternalUrl(c.links?.homepage?.find(Boolean) ?? null),
      platforms,
      marketCapRank: c.market_cap_rank ?? null,
      price: c.market_data?.current_price?.usd ?? null,
      marketCap: c.market_data?.market_cap?.usd ?? null,
      volume24h: c.market_data?.total_volume?.usd ?? null,
      change1h: c.market_data?.price_change_percentage_1h_in_currency?.usd ?? null,
      change24h: c.market_data?.price_change_percentage_24h ?? null,
      change7d: c.market_data?.price_change_percentage_7d ?? null,
      fdv: c.market_data?.fully_diluted_valuation?.usd ?? null,
      lastUpdated: c.last_updated ?? null,
    },
  };
}

const chartSchema = z.object({ prices: z.array(z.tuple([z.number(), z.number()])) });

export async function getChart(id: string, days: string): Promise<FetchResult<ChartPoint[]>> {
  const res = await cgFetch<unknown>(
    `/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${encodeURIComponent(days)}`,
    cacheConfig.chartSeconds,
    `chart:${id}:${days}`,
  );
  const parsed = chartSchema.parse(res.data);
  return { ...res, data: parsed.prices.map(([t, price]) => ({ t, price })) };
}

export async function getByContract(platform: string, address: string) {
  const res = await cgFetch<unknown>(
    `/coins/${encodeURIComponent(platform)}/contract/${encodeURIComponent(address)}`,
    cacheConfig.metadataSeconds,
    `contract:${platform}:${address.toLowerCase()}`,
  );
  const c = coinSchema.parse(res.data);
  return { ...res, data: { id: c.id, symbol: c.symbol, name: c.name } };
}
