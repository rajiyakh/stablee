import { z } from "zod";
import { cacheConfig } from "@/config/trending";
import type { DexMarket } from "./types";
import { fetchJson, type FetchResult } from "./http.server";
import { sanitizeExternalUrl } from "./format";

const BASE = () => process.env.DEXSCREENER_API_BASE_URL || "https://api.dexscreener.com";

export const DEXSCREENER_ATTRIBUTION = "DEX market data by DEX Screener";

const txWindow = z.object({ buys: z.number().nullish(), sells: z.number().nullish() }).nullish();

const pairSchema = z.object({
  chainId: z.string(),
  dexId: z.string().nullish(),
  url: z.string().nullish(),
  pairAddress: z.string(),
  baseToken: z.object({
    address: z.string(),
    name: z.string().nullish(),
    symbol: z.string().nullish(),
  }),
  quoteToken: z.object({
    address: z.string().nullish(),
    name: z.string().nullish(),
    symbol: z.string().nullish(),
  }),
  priceNative: z.union([z.string(), z.number()]).nullish(),
  priceUsd: z.union([z.string(), z.number()]).nullish(),
  txns: z.object({ m5: txWindow, h1: txWindow, h6: txWindow, h24: txWindow }).nullish(),
  volume: z
    .object({
      m5: z.number().nullish(),
      h1: z.number().nullish(),
      h6: z.number().nullish(),
      h24: z.number().nullish(),
    })
    .nullish(),
  priceChange: z
    .object({
      m5: z.number().nullish(),
      h1: z.number().nullish(),
      h6: z.number().nullish(),
      h24: z.number().nullish(),
    })
    .nullish(),
  liquidity: z.object({ usd: z.number().nullish() }).nullish(),
  fdv: z.number().nullish(),
  marketCap: z.number().nullish(),
  pairCreatedAt: z.number().nullish(),
  info: z
    .object({
      imageUrl: z.string().nullish(),
      header: z.string().nullish(),
      websites: z.array(z.object({ label: z.string().nullish(), url: z.string() })).nullish(),
      socials: z.array(z.object({ type: z.string().nullish(), url: z.string() })).nullish(),
    })
    .nullish(),
  boosts: z.object({ active: z.number().nullish() }).nullish(),
});

type RawPair = z.infer<typeof pairSchema>;

const num = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : null;
};

const tx = (w: { buys?: number | null; sells?: number | null } | null | undefined) => ({
  buys: w?.buys ?? null,
  sells: w?.sells ?? null,
});

export function normalisePair(p: RawPair): DexMarket {
  return {
    source: "dexscreener",
    chainId: p.chainId,
    dexId: p.dexId ?? null,
    pairAddress: p.pairAddress,
    url: p.url ?? null,
    baseToken: {
      address: p.baseToken.address,
      name: p.baseToken.name ?? null,
      symbol: p.baseToken.symbol ?? null,
    },
    quoteToken: {
      address: p.quoteToken.address ?? null,
      name: p.quoteToken.name ?? null,
      symbol: p.quoteToken.symbol ?? null,
    },
    priceUsd: num(p.priceUsd),
    priceNative: num(p.priceNative),
    priceChange: {
      m5: p.priceChange?.m5 ?? null,
      h1: p.priceChange?.h1 ?? null,
      h6: p.priceChange?.h6 ?? null,
      h24: p.priceChange?.h24 ?? null,
    },
    volume: {
      m5: p.volume?.m5 ?? null,
      h1: p.volume?.h1 ?? null,
      h6: p.volume?.h6 ?? null,
      h24: p.volume?.h24 ?? null,
    },
    txns: {
      m5: tx(p.txns?.m5),
      h1: tx(p.txns?.h1),
      h6: tx(p.txns?.h6),
      h24: tx(p.txns?.h24),
    },
    liquidityUsd: p.liquidity?.usd ?? null,
    fdv: p.fdv ?? null,
    marketCap: p.marketCap ?? null,
    pairCreatedAt: p.pairCreatedAt ?? null,
    imageUrl: p.info?.imageUrl ?? null,
    headerUrl: p.info?.header ?? null,
    websites: (p.info?.websites ?? [])
      .map((w) => ({ label: w.label ?? "Website", url: sanitizeExternalUrl(w.url) }))
      .filter((w): w is { label: string; url: string } => w.url !== null),
    socials: (p.info?.socials ?? [])
      .map((s) => ({ type: s.type ?? "link", url: sanitizeExternalUrl(s.url) }))
      .filter((s): s is { type: string; url: string } => s.url !== null),
    boostAmount: p.boosts?.active ?? null,
  };
}

const pairsResponse = z.object({ pairs: z.array(pairSchema).nullish() });
const pairsArrayResponse = z.array(pairSchema);

async function dsFetch<T>(path: string, ttl: number, cacheKey: string): Promise<FetchResult<T>> {
  return fetchJson<T>(`${BASE()}${path}`, {
    provider: "dexscreener",
    cacheKey: `ds:${cacheKey}`,
    ttlSeconds: ttl,
  });
}

export async function searchPairs(query: string): Promise<FetchResult<DexMarket[]>> {
  const res = await dsFetch<unknown>(
    `/latest/dex/search?q=${encodeURIComponent(query)}`,
    cacheConfig.priceSeconds,
    `search:${query.toLowerCase()}`,
  );
  const parsed = pairsResponse.parse(res.data);
  return { ...res, data: (parsed.pairs ?? []).map(normalisePair) };
}

export async function getPair(chainId: string, pairId: string): Promise<FetchResult<DexMarket[]>> {
  const res = await dsFetch<unknown>(
    `/latest/dex/pairs/${encodeURIComponent(chainId)}/${encodeURIComponent(pairId)}`,
    cacheConfig.priceSeconds,
    `pair:${chainId}:${pairId}`,
  );
  const parsed = pairsResponse.parse(res.data);
  return { ...res, data: (parsed.pairs ?? []).map(normalisePair) };
}

export async function getTokenPairs(
  chainId: string,
  tokenAddress: string,
): Promise<FetchResult<DexMarket[]>> {
  const res = await dsFetch<unknown>(
    `/token-pairs/v1/${encodeURIComponent(chainId)}/${encodeURIComponent(tokenAddress)}`,
    cacheConfig.priceSeconds,
    `tokenpairs:${chainId}:${tokenAddress.toLowerCase()}`,
  );
  const parsed = pairsArrayResponse.parse(res.data ?? []);
  return { ...res, data: parsed.map(normalisePair) };
}

export async function getTokens(
  chainId: string,
  addresses: string[],
): Promise<FetchResult<DexMarket[]>> {
  const joined = addresses.join(",");
  const res = await dsFetch<unknown>(
    `/tokens/v1/${encodeURIComponent(chainId)}/${encodeURIComponent(joined)}`,
    cacheConfig.priceSeconds,
    `tokens:${chainId}:${joined.toLowerCase()}`,
  );
  const parsed = pairsArrayResponse.parse(res.data ?? []);
  return { ...res, data: parsed.map(normalisePair) };
}

const profileSchema = z.array(
  z.object({
    chainId: z.string(),
    tokenAddress: z.string(),
    icon: z.string().nullish(),
    header: z.string().nullish(),
    description: z.string().nullish(),
    url: z.string().nullish(),
  }),
);

const boostSchema = z.array(
  z.object({
    chainId: z.string(),
    tokenAddress: z.string(),
    amount: z.number().nullish(),
    totalAmount: z.number().nullish(),
    icon: z.string().nullish(),
  }),
);

export interface DiscoveryToken {
  chainId: string;
  tokenAddress: string;
  icon: string | null;
  boostAmount: number | null;
  promotional: boolean;
}

/** Discovers candidate tokens for a specific chain from profile/boost feeds. */
export async function discoverChainTokens(chainId: string): Promise<{
  tokens: DiscoveryToken[];
  fetchedAt: string;
  stale: boolean;
  cached: boolean;
}> {
  const [profiles, boosts, topBoosts] = await Promise.allSettled([
    dsFetch<unknown>("/token-profiles/latest/v1", cacheConfig.trendingSeconds, "profiles"),
    dsFetch<unknown>("/token-boosts/latest/v1", cacheConfig.trendingSeconds, "boosts"),
    dsFetch<unknown>("/token-boosts/top/v1", cacheConfig.trendingSeconds, "boosts-top"),
  ]);

  const map = new Map<string, DiscoveryToken>();
  let fetchedAt: string | null = null;
  let stale = false;
  let cached = false;

  if (profiles.status === "fulfilled") {
    fetchedAt = profiles.value.fetchedAt;
    stale ||= profiles.value.stale;
    cached ||= profiles.value.cached;
    for (const p of profileSchema.parse(profiles.value.data ?? [])) {
      if (p.chainId.toLowerCase() !== chainId.toLowerCase()) continue;
      map.set(p.tokenAddress.toLowerCase(), {
        chainId: p.chainId,
        tokenAddress: p.tokenAddress,
        icon: p.icon ?? null,
        boostAmount: null,
        promotional: false,
      });
    }
  }

  for (const settled of [boosts, topBoosts]) {
    if (settled.status !== "fulfilled") continue;
    fetchedAt ??= settled.value.fetchedAt;
    stale ||= settled.value.stale;
    for (const b of boostSchema.parse(settled.value.data ?? [])) {
      if (b.chainId.toLowerCase() !== chainId.toLowerCase()) continue;
      const key = b.tokenAddress.toLowerCase();
      const existing = map.get(key);
      map.set(key, {
        chainId: b.chainId,
        tokenAddress: b.tokenAddress,
        icon: b.icon ?? existing?.icon ?? null,
        boostAmount: b.amount ?? b.totalAmount ?? null,
        promotional: true,
      });
    }
  }

  if (
    profiles.status === "rejected" &&
    boosts.status === "rejected" &&
    topBoosts.status === "rejected"
  ) {
    throw profiles.reason;
  }

  return {
    tokens: [...map.values()],
    fetchedAt: fetchedAt ?? new Date().toISOString(),
    stale,
    cached,
  };
}
