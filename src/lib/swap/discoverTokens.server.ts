import { createPublicClient, http, type Address } from "viem";
import { robinhoodChainFacts } from "@/config/robinhoodChain";
import { findSwapToken, swapTokens, type SwapTokenConfig } from "@/config/swapTokens";
import { erc20Abi } from "./erc20";
import { fetchGmgnTrending, gmgnConfigured } from "@/providers/gmgn/client.server";
import { gmgnTrendingResponseSchema } from "@/providers/gmgn/schemas";
import { normalizeTrending } from "@/providers/gmgn/normalize";

const MAX_DISCOVERED_TOKENS = 20;
const DISCOVERY_CACHE_TTL_MS = 60_000;
const CUSTOM_TOKEN_CACHE_TTL_MS = 5 * 60_000;
const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export interface DiscoveredSwapToken extends SwapTokenConfig {
  source: "gmgn" | "custom";
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
const customTokenCache = new Map<
  string,
  { token: DiscoveredSwapToken | null; expiresAt: number }
>();

/**
 * Third resolution tier, tried only after the curated list and GMGN's
 * trending dataset both miss — resolves ANY syntactically valid address by
 * reading decimals()/symbol()/name() directly on-chain, same trust model as
 * discoverSwapTokens(): every field comes from a real on-chain read, never
 * fabricated or trusted from the caller. Returns null (not a token, or the
 * calls revert/fail — e.g. not a contract, not ERC-20-shaped) rather than
 * ever guessing. Cached per-address for a few minutes so re-selecting the
 * same custom token doesn't re-read on every request.
 */
export async function resolveCustomToken(address: string): Promise<DiscoveredSwapToken | null> {
  if (!EVM_ADDRESS_RE.test(address)) return null;
  const key = address.toLowerCase();

  const cached = customTokenCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const client = getPublicClient();
  if (!client) return null;

  let token: DiscoveredSwapToken | null = null;
  try {
    const [decimals, symbol, name] = await Promise.all([
      client.readContract({ address: address as Address, abi: erc20Abi, functionName: "decimals" }),
      client.readContract({ address: address as Address, abi: erc20Abi, functionName: "symbol" }),
      client.readContract({ address: address as Address, abi: erc20Abi, functionName: "name" }),
    ]);
    token = {
      address,
      symbol,
      name,
      decimals: Number(decimals),
      verified: false,
      source: "custom",
    };
  } catch {
    token = null; // not a contract, not ERC-20-shaped, or the RPC call failed — never guess
  }

  customTokenCache.set(key, { token, expiresAt: Date.now() + CUSTOM_TOKEN_CACHE_TTL_MS });
  return token;
}

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
    const candidates = normalizeTrending(parsed, "24h").filter(
      (candidate) => !findSwapToken(candidate.address), // already curated — don't duplicate
    );

    // Decimals reads run in parallel. This used to be a sequential
    // await-in-a-loop (one RPC round trip at a time, up to 20 candidates) —
    // measured at 5+ seconds end to end. That latency was mostly invisible
    // while this only backed a background token-list refresh, but became a
    // real, felt delay once resolveSwapToken() started being called
    // synchronously from a Buy-button deep link (a user expects /swap to
    // already show their token, not spend 5+ seconds resolving it).
    const resolved = await Promise.all(
      candidates.map(async (candidate): Promise<DiscoveredSwapToken | null> => {
        const decimals = await readDecimalsOnChain(candidate.address);
        if (decimals === null) return null; // couldn't confirm on-chain — never guess a decimals value
        return {
          address: candidate.address,
          symbol: candidate.symbol,
          name: candidate.name,
          decimals,
          logoUrl: candidate.logoUrl,
          verified: false,
          source: "gmgn",
        };
      }),
    );
    const discovered = resolved
      .filter((t): t is DiscoveredSwapToken => t !== null)
      .slice(0, MAX_DISCOVERED_TOKENS);

    cache = { tokens: discovered, expiresAt: Date.now() + DISCOVERY_CACHE_TTL_MS };
    return discovered;
  } catch {
    return [];
  }
}

/**
 * Curated tokens first, then anything GMGN-discovered and on-chain-confirmed,
 * then — for any address neither of those know about — a direct on-chain
 * lookup (see resolveCustomToken). This is the only function callers should
 * use to resolve a token from an address; it's what makes a pasted contract
 * address tradeable via /api/swap/price and /api/swap/quote, not just
 * selectable in the picker.
 */
export async function resolveSwapToken(address: string): Promise<SwapTokenConfig | null> {
  const curated = findSwapToken(address);
  if (curated) return curated;

  const discovered = await discoverSwapTokens();
  const fromDiscovery = discovered.find((t) => t.address.toLowerCase() === address.toLowerCase());
  if (fromDiscovery) return fromDiscovery;

  return resolveCustomToken(address);
}

export async function allSwapTokens(): Promise<SwapTokenConfig[]> {
  return [...swapTokens, ...(await discoverSwapTokens())];
}
