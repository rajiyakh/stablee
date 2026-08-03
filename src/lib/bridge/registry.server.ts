import { SUPPORT_CACHE_TTL_MS } from "@/config/bridgePolicy";
import { lifiAdapter } from "./providers/lifi.server";
import { relayAdapter } from "./providers/relay.server";
import { acrossAdapter } from "./providers/across.server";
import { gaszipAdapter } from "./providers/gaszip.server";
import type { BridgeAdapter, BridgeQuoteParams, SupportedChain, SupportedToken } from "./types";

export function allAdapters(): BridgeAdapter[] {
  return [lifiAdapter, relayAdapter, acrossAdapter, gaszipAdapter];
}

/** Enabled AND actually configured (env keys present) — never assumed just because a flag is on. */
export function enabledAdapters(): BridgeAdapter[] {
  return allAdapters().filter((adapter) => adapter.configured());
}

/** Enabled, configured, AND able to actually carry RobinPulse's mandatory fee right now. */
export function feeBearingAdapters(): BridgeAdapter[] {
  return enabledAdapters().filter((adapter) => adapter.feeMode() === "provider-native");
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const chainsCache = new Map<string, CacheEntry<SupportedChain[]>>();
const tokensCache = new Map<string, CacheEntry<SupportedToken[]>>();

async function cachedChains(adapter: BridgeAdapter): Promise<SupportedChain[]> {
  const key = adapter.id;
  const cached = chainsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const chains = await adapter.getSupportedChains();
  chainsCache.set(key, { value: chains, expiresAt: Date.now() + SUPPORT_CACHE_TTL_MS });
  return chains;
}

async function cachedTokens(adapter: BridgeAdapter, chainId: number): Promise<SupportedToken[]> {
  const key = `${adapter.id}:${chainId}`;
  const cached = tokensCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const tokens = await adapter.getSupportedTokens(chainId);
  tokensCache.set(key, { value: tokens, expiresAt: Date.now() + SUPPORT_CACHE_TTL_MS });
  return tokens;
}

function dedupeChains(chains: SupportedChain[]): SupportedChain[] {
  const byId = new Map<number, SupportedChain>();
  for (const chain of chains) {
    if (!byId.has(chain.chainId)) byId.set(chain.chainId, chain);
  }
  return [...byId.values()];
}

function dedupeTokens(tokens: SupportedToken[]): SupportedToken[] {
  const byAddress = new Map<string, SupportedToken>();
  for (const token of tokens) {
    const key = token.address.toLowerCase();
    if (!byAddress.has(key)) byAddress.set(key, token);
  }
  return [...byAddress.values()];
}

export async function supportedChainsUnion(): Promise<SupportedChain[]> {
  const results = await Promise.allSettled(
    enabledAdapters().map((adapter) => cachedChains(adapter)),
  );
  const chains = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  return dedupeChains(chains);
}

export async function supportedTokensUnion(chainId: number): Promise<SupportedToken[]> {
  const results = await Promise.allSettled(
    enabledAdapters().map((adapter) => cachedTokens(adapter, chainId)),
  );
  const tokens = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  return dedupeTokens(tokens);
}

export interface AdapterSupportCheck {
  adapter: BridgeAdapter;
  supported: boolean;
  reason: string | null;
}

/**
 * The structural "never assume support, never fabricate a route" gate: an
 * adapter is only asked for a quote once its OWN cached supported-chains
 * AND supported-tokens lists explicitly confirm the source chain,
 * destination chain, input token, and output token — checked here, before
 * any getQuote() call, not inferred from the adapter merely being enabled.
 */
export async function adaptersSupportingRoute(
  params: BridgeQuoteParams,
): Promise<AdapterSupportCheck[]> {
  const candidates = feeBearingAdapters();

  return Promise.all(
    candidates.map(async (adapter): Promise<AdapterSupportCheck> => {
      try {
        const [chains, fromTokens, toTokens] = await Promise.all([
          cachedChains(adapter),
          cachedTokens(adapter, params.fromChainId),
          cachedTokens(adapter, params.toChainId),
        ]);

        const supportsFromChain = chains.some((c) => c.chainId === params.fromChainId);
        const supportsToChain = chains.some((c) => c.chainId === params.toChainId);
        if (!supportsFromChain)
          return { adapter, supported: false, reason: "source chain not supported" };
        if (!supportsToChain)
          return { adapter, supported: false, reason: "destination chain not supported" };

        const supportsFromToken = fromTokens.some(
          (t) => t.address.toLowerCase() === params.fromToken.toLowerCase(),
        );
        const supportsToToken = toTokens.some(
          (t) => t.address.toLowerCase() === params.toToken.toLowerCase(),
        );
        if (!supportsFromToken)
          return { adapter, supported: false, reason: "source token not supported" };
        if (!supportsToToken)
          return { adapter, supported: false, reason: "destination token not supported" };

        return { adapter, supported: true, reason: null };
      } catch {
        return { adapter, supported: false, reason: "support check failed" };
      }
    }),
  );
}
