/**
 * Robinhood Mainnet market composition layer.
 *
 * There is no dedicated Robinhood-chain indexer or factory contract wired
 * into this app. "Robinhood Mainnet support" is composed entirely from real,
 * already-configured providers: DEX Screener discovery scoped to the
 * configured chain ID, plus the owner-verified token registry. This module
 * is a thin, honest wrapper around that — not a new upstream integration.
 */
import { discoverChainTokens, getTokens } from "@/lib/market/dexscreener.server";
import { verifiedTokensForChain } from "@/config/verifiedTokens";
import { rankMarkets } from "@/lib/market/trending";
import { fetchGmgnTrending, gmgnConfigured } from "@/providers/gmgn/client.server";
import { gmgnTrendingResponseSchema } from "@/providers/gmgn/schemas";
import { normalizeTrending } from "@/providers/gmgn/normalize";
import type { DexMarket, ScoredMarket } from "@/lib/market/types";

const MAX_CANDIDATE_ADDRESSES = 150;

/**
 * DEX Screener's discovery feeds (token-profiles/token-boosts) are global
 * "trending across every chain" lists — a young, less-hyped chain like
 * Robinhood Mainnet can easily have zero entries there even when it has real
 * active tokens. GMGN's dedicated Robinhood Mainnet trending endpoint (the
 * same one that powers /markets/trending) is a much richer, chain-scoped
 * discovery source, so its addresses are merged in as additional candidates
 * when GMGN is configured. Purely additive: if GMGN isn't configured or the
 * call fails, discovery behaves exactly as before.
 */
async function discoverGmgnAddresses(): Promise<string[]> {
  if (!gmgnConfigured()) return [];
  try {
    const res = await fetchGmgnTrending({ chain: "robinhood", interval: "24h", limit: 100 });
    const parsed = gmgnTrendingResponseSchema.parse(res.data);
    return normalizeTrending(parsed, "24h").map((t) => t.address);
  } catch {
    return [];
  }
}

export interface RobinhoodMarketsResult {
  markets: ScoredMarket[];
  boosted: string[];
  fetchedAt: string;
  cached: boolean;
  stale: boolean;
}

/** Real, provider-backed Robinhood Mainnet markets only. Never substitutes another chain. */
export async function getRobinhoodMainnetMarkets(chainId: string): Promise<RobinhoodMarketsResult> {
  const [discovery, gmgnAddresses] = await Promise.all([
    discoverChainTokens(chainId),
    discoverGmgnAddresses(),
  ]);
  const verified = verifiedTokensForChain(chainId).map((t) => t.address);
  const addresses = Array.from(
    new Set([...discovery.tokens.map((t) => t.tokenAddress), ...gmgnAddresses, ...verified]),
  ).slice(0, MAX_CANDIDATE_ADDRESSES);

  if (!addresses.length) {
    return {
      markets: [],
      boosted: [],
      fetchedAt: discovery.fetchedAt,
      cached: discovery.cached,
      stale: discovery.stale,
    };
  }

  const batches: DexMarket[] = [];
  for (let i = 0; i < addresses.length; i += 25) {
    const slice = addresses.slice(i, i + 25);
    try {
      const res = await getTokens(chainId, slice);
      batches.push(...res.data);
    } catch {
      // A failed batch is skipped — never replaced with invented rows.
    }
  }

  const boostMap = new Map(
    discovery.tokens
      .filter((t) => t.boostAmount)
      .map((t) => [t.tokenAddress.toLowerCase(), t.boostAmount as number]),
  );
  const withBoosts = batches
    .filter((m) => m.chainId.toLowerCase() === chainId.toLowerCase())
    .map((m) => ({
      ...m,
      boostAmount: boostMap.get(m.baseToken.address.toLowerCase()) ?? null,
    }));

  const ranked = rankMarkets(withBoosts, { applySafeguards: true });

  return {
    markets: ranked,
    boosted: [...boostMap.keys()],
    fetchedAt: discovery.fetchedAt,
    cached: discovery.cached,
    stale: discovery.stale,
  };
}
