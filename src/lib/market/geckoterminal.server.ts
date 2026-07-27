import { z } from "zod";
import { cacheConfig } from "@/config/trending";
import type { DexMarket, OhlcvPoint } from "./types";
import { fetchJson, type FetchResult } from "./http.server";

const BASE = () => process.env.GECKOTERMINAL_API_BASE_URL || "https://api.geckoterminal.com/api/v2";

export const GECKOTERMINAL_ATTRIBUTION = "Pool data by GeckoTerminal";

export function robinhoodNetworkId(): string {
  return (process.env.GECKOTERMINAL_ROBINHOOD_NETWORK_ID || "").trim();
}

export function geckoTerminalConfigured(): boolean {
  return robinhoodNetworkId().length > 0;
}

async function gtFetch<T>(path: string, ttl: number, cacheKey: string): Promise<FetchResult<T>> {
  return fetchJson<T>(`${BASE()}${path}`, {
    provider: "geckoterminal",
    cacheKey: `gt:${cacheKey}`,
    ttlSeconds: ttl,
    headers: { accept: "application/json;version=20230302" },
  });
}

const networksSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({ name: z.string().nullish() }).nullish(),
    }),
  ),
});

export async function getNetworks() {
  const res = await gtFetch<unknown>("/networks", cacheConfig.metadataSeconds, "networks");
  const parsed = networksSchema.parse(res.data);
  return {
    ...res,
    data: parsed.data.map((n) => ({ id: n.id, name: n.attributes?.name ?? n.id })),
  };
}

const poolSchema = z.object({
  id: z.string(),
  attributes: z.object({
    address: z.string(),
    name: z.string().nullish(),
    base_token_price_usd: z.string().nullish(),
    base_token_price_native_currency: z.string().nullish(),
    pool_created_at: z.string().nullish(),
    fdv_usd: z.string().nullish(),
    market_cap_usd: z.string().nullish(),
    price_change_percentage: z
      .object({
        m5: z.string().nullish(),
        h1: z.string().nullish(),
        h6: z.string().nullish(),
        h24: z.string().nullish(),
      })
      .nullish(),
    transactions: z
      .record(
        z.string(),
        z.object({ buys: z.number().nullish(), sells: z.number().nullish() }).nullish(),
      )
      .nullish(),
    volume_usd: z
      .object({
        h1: z.string().nullish(),
        h6: z.string().nullish(),
        h24: z.string().nullish(),
      })
      .nullish(),
    reserve_in_usd: z.string().nullish(),
  }),
  relationships: z
    .object({
      base_token: z.object({ data: z.object({ id: z.string() }).nullish() }).nullish(),
      quote_token: z.object({ data: z.object({ id: z.string() }).nullish() }).nullish(),
      dex: z.object({ data: z.object({ id: z.string() }).nullish() }).nullish(),
    })
    .nullish(),
});

const poolsSchema = z.object({ data: z.array(poolSchema) });

const numStr = (v: string | null | undefined): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const tokenAddress = (id: string | null | undefined): string =>
  (id ?? "").split("_").slice(1).join("_") || (id ?? "");

function normalisePool(networkId: string, p: z.infer<typeof poolSchema>): DexMarket {
  const a = p.attributes;
  const txns = a.transactions ?? {};
  const win = (k: string) => ({
    buys: txns[k]?.buys ?? null,
    sells: txns[k]?.sells ?? null,
  });
  return {
    source: "geckoterminal",
    chainId: networkId,
    dexId: p.relationships?.dex?.data?.id ?? null,
    pairAddress: a.address,
    url: `https://www.geckoterminal.com/${networkId}/pools/${a.address}`,
    baseToken: {
      address: tokenAddress(p.relationships?.base_token?.data?.id),
      name: a.name?.split("/")[0]?.trim() ?? null,
      symbol: a.name?.split("/")[0]?.trim() ?? null,
    },
    quoteToken: {
      address: tokenAddress(p.relationships?.quote_token?.data?.id),
      name: a.name?.split("/")[1]?.trim() ?? null,
      symbol: a.name?.split("/")[1]?.trim() ?? null,
    },
    priceUsd: numStr(a.base_token_price_usd),
    priceNative: numStr(a.base_token_price_native_currency),
    priceChange: {
      m5: numStr(a.price_change_percentage?.m5),
      h1: numStr(a.price_change_percentage?.h1),
      h6: numStr(a.price_change_percentage?.h6),
      h24: numStr(a.price_change_percentage?.h24),
    },
    volume: {
      m5: null,
      h1: numStr(a.volume_usd?.h1),
      h6: numStr(a.volume_usd?.h6),
      h24: numStr(a.volume_usd?.h24),
    },
    txns: { m5: win("m5"), h1: win("h1"), h6: win("h6"), h24: win("h24") },
    liquidityUsd: numStr(a.reserve_in_usd),
    fdv: numStr(a.fdv_usd),
    marketCap: numStr(a.market_cap_usd),
    pairCreatedAt: a.pool_created_at ? new Date(a.pool_created_at).getTime() : null,
    imageUrl: null,
    headerUrl: null,
    websites: [],
    socials: [],
    boostAmount: null,
  };
}

export async function getPools(networkId: string): Promise<FetchResult<DexMarket[]>> {
  const res = await gtFetch<unknown>(
    `/networks/${encodeURIComponent(networkId)}/pools?page=1`,
    cacheConfig.trendingSeconds,
    `pools:${networkId}`,
  );
  const parsed = poolsSchema.parse(res.data);
  return { ...res, data: parsed.data.map((p) => normalisePool(networkId, p)) };
}

export async function getTrendingPools(networkId: string): Promise<FetchResult<DexMarket[]>> {
  const res = await gtFetch<unknown>(
    `/networks/${encodeURIComponent(networkId)}/trending_pools`,
    cacheConfig.trendingSeconds,
    `trending:${networkId}`,
  );
  const parsed = poolsSchema.parse(res.data);
  return { ...res, data: parsed.data.map((p) => normalisePool(networkId, p)) };
}

export async function getTokenPools(
  networkId: string,
  address: string,
): Promise<FetchResult<DexMarket[]>> {
  const res = await gtFetch<unknown>(
    `/networks/${encodeURIComponent(networkId)}/tokens/${encodeURIComponent(address)}/pools`,
    cacheConfig.priceSeconds,
    `tokenpools:${networkId}:${address.toLowerCase()}`,
  );
  const parsed = poolsSchema.parse(res.data);
  return { ...res, data: parsed.data.map((p) => normalisePool(networkId, p)) };
}

const ohlcvSchema = z.object({
  data: z.object({
    attributes: z.object({ ohlcv_list: z.array(z.array(z.number())) }),
  }),
});

export async function getPoolOhlcv(
  networkId: string,
  poolAddress: string,
): Promise<FetchResult<OhlcvPoint[]>> {
  const res = await gtFetch<unknown>(
    `/networks/${encodeURIComponent(networkId)}/pools/${encodeURIComponent(poolAddress)}/ohlcv/hour?limit=168`,
    cacheConfig.chartSeconds,
    `ohlcv:${networkId}:${poolAddress.toLowerCase()}`,
  );
  const parsed = ohlcvSchema.parse(res.data);
  return {
    ...res,
    data: parsed.data.attributes.ohlcv_list
      .map(([t, open, high, low, close, volume]) => ({
        t: t * 1000,
        open,
        high,
        low,
        close,
        volume: volume ?? 0,
      }))
      .sort((a, b) => a.t - b.t),
  };
}
