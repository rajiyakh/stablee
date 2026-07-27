import { createPublicClient, http, type Address } from "viem";
import { robinhoodChainFacts } from "@/config/robinhoodChain";
import { findSwapToken, swapTokens, type SwapTokenConfig } from "@/config/swapTokens";
import { erc20Abi } from "./erc20";
import { fetchGmgnTrending, gmgnConfigured } from "@/providers/gmgn/client.server";
import { gmgnTrendingResponseSchema } from "@/providers/gmgn/schemas";
import { normalizeTrending } from "@/providers/gmgn/normalize";

const MAX_DISCOVERED_TOKENS = 20;
const DISCOVERY_CACHE_TTL_MS = 60_000;

export interface DiscoveredSwapToken extends SwapTokenConfig {
  source: "gmgn";
}

let publicClient: ReturnType<typeof createPublicClient> | null = null;

function getPublicClient() {
  if (!robinhoodChainFacts) return null;
  if (!publicClient) {
    publicClient = createPublicClient({
      chain: robinhoodChainFacts,
      transport: http(process.env.ROBINHOOD_RPC_URL || robinhoodChainFacts.rpcUrls.default.http[0]),
    });
  }
  return publicClient;
}

/**
 * Decimals are read directly on-chain rather than trusted from GMGN or any
 * other off-chain source — this value feeds the $20/$0.02 minimum checks, so
 * it must come from ground truth, not a provider's claim about the token.
 */
async function readDecimalsOnChain(address: string): Promise<number | null> {
  const client = getPublicClient();
  if (!client) return null;
  try {
    const decimals = await client.readContract({
      address: address as Address,
      abi: erc20Abi,
      functionName: "decimals",
    });
    return Number(decimals);
  } catch {
    return null;
  }
}

let cache: { tokens: DiscoveredSwapToken[]; expiresAt: number } | null = null;

/**
 * Broadens the swap-eligible token list beyond the small hardcoded
 * swapTokens.ts registry, using GMGN's real Robinhood Mainnet trending data
 * (the same discovery source /markets/trending already uses) as candidates,
 * with each candidate's decimals independently confirmed on-chain before
 * it's ever treated as swappable. Returns [] (never fabricated rows) when
 * GMGN isn't configured, the call fails, or a candidate's decimals can't be
 * confirmed. Every discovered token is `verified: false` — the UI shows the
 * Unverified badge and risk warnings for these, same as any other
 * community token.
 */
export async function discoverSwapTokens(): Promise<DiscoveredSwapToken[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.tokens;
  if (!gmgnConfigured()) return [];

  try {
    const res = await fetchGmgnTrending({
      chain: "robinhood",
      interval: "24h",
      limit: MAX_DISCOVERED_TOKENS,
    });
    const parsed = gmgnTrendingResponseSchema.parse(res.data);
    const candidates = normalizeTrending(parsed, "24h");

    const discovered: DiscoveredSwapToken[] = [];
    for (const candidate of candidates) {
      if (discovered.length >= MAX_DISCOVERED_TOKENS) break;
      if (findSwapToken(candidate.address)) continue; // already curated — don't duplicate

      const decimals = await readDecimalsOnChain(candidate.address);
      if (decimals === null) continue; // couldn't confirm on-chain — never guess a decimals value

      discovered.push({
        address: candidate.address,
        symbol: candidate.symbol,
        name: candidate.name,
        decimals,
        logoUrl: candidate.logoUrl,
        verified: false,
        source: "gmgn",
      });
    }

    cache = { tokens: discovered, expiresAt: Date.now() + DISCOVERY_CACHE_TTL_MS };
    return discovered;
  } catch {
    return [];
  }
}

/** Curated tokens first, then anything GMGN-discovered and on-chain-confirmed. */
export async function resolveSwapToken(address: string): Promise<SwapTokenConfig | null> {
  const curated = findSwapToken(address);
  if (curated) return curated;

  const discovered = await discoverSwapTokens();
  return discovered.find((t) => t.address.toLowerCase() === address.toLowerCase()) ?? null;
}

export async function allSwapTokens(): Promise<SwapTokenConfig[]> {
  return [...swapTokens, ...(await discoverSwapTokens())];
}
