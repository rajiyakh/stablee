import { queryOptions } from "@tanstack/react-query";
import { getEnvelope } from "@/lib/market/client";
import type { RouteEngineResult } from "./routeEngine.server";
import type {
  BridgeSortMode,
  BridgeTransactionStatus,
  SupportedChain,
  SupportedToken,
} from "./types";

export interface BridgeQuoteRequestParams {
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  sender: string;
  recipient: string;
  slippageBps?: number;
  sort?: BridgeSortMode;
}

export interface BridgeProviderDisclosure {
  treasuryConfigured: boolean;
  providers: Array<{
    id: string;
    displayName: string;
    configured: boolean;
    feeMode: "provider-native" | "unavailable";
  }>;
}

function buildQuoteParams(params: BridgeQuoteRequestParams): string {
  const q = new URLSearchParams({
    fromChainId: String(params.fromChainId),
    toChainId: String(params.toChainId),
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    sender: params.sender,
    recipient: params.recipient,
  });
  if (params.slippageBps) q.set("slippageBps", String(params.slippageBps));
  if (params.sort) q.set("sort", params.sort);
  return q.toString();
}

export const bridgeKeys = {
  providers: ["bridge", "providers"] as const,
  chains: ["bridge", "chains"] as const,
  tokens: (chainId: number) => ["bridge", "tokens", chainId] as const,
  quote: (params: BridgeQuoteRequestParams) =>
    ["bridge", "quote", buildQuoteParams(params)] as const,
  status: (provider: string, routeId: string, txHash: string) =>
    ["bridge", "status", provider, routeId, txHash] as const,
};

export const bridgeProvidersQuery = () =>
  queryOptions({
    queryKey: bridgeKeys.providers,
    queryFn: () => getEnvelope<BridgeProviderDisclosure>("/api/bridge/providers"),
    staleTime: 60_000,
  });

export const bridgeChainsQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: bridgeKeys.chains,
    queryFn: () => getEnvelope<SupportedChain[]>("/api/bridge/chains"),
    enabled,
    staleTime: 5 * 60_000,
  });

export const bridgeTokensQuery = (chainId: number | null, enabled: boolean) =>
  queryOptions({
    queryKey: bridgeKeys.tokens(chainId ?? 0),
    queryFn: () => getEnvelope<SupportedToken[]>(`/api/bridge/tokens?chainId=${chainId}`),
    enabled: enabled && chainId !== null,
    staleTime: 5 * 60_000,
  });

export const bridgeQuoteQuery = (params: BridgeQuoteRequestParams, enabled: boolean) =>
  queryOptions({
    queryKey: bridgeKeys.quote(params),
    queryFn: () => getEnvelope<RouteEngineResult>(`/api/bridge/quote?${buildQuoteParams(params)}`),
    enabled:
      enabled &&
      Boolean(
        params.fromChainId &&
        params.toChainId &&
        params.fromToken &&
        params.toToken &&
        params.fromAmount &&
        params.sender &&
        params.recipient,
      ),
    staleTime: 0,
    retry: false,
  });

export const bridgeStatusQuery = (
  provider: string,
  routeId: string,
  txHash: string,
  fromChainId: number,
  toChainId: number,
  enabled: boolean,
) =>
  queryOptions({
    queryKey: bridgeKeys.status(provider, routeId, txHash),
    queryFn: () =>
      getEnvelope<BridgeTransactionStatus>(
        `/api/bridge/status?provider=${provider}&routeId=${encodeURIComponent(routeId)}&txHash=${txHash}&fromChainId=${fromChainId}&toChainId=${toChainId}`,
      ),
    enabled,
    staleTime: 0,
    // Stops polling once the status reaches a terminal state — never keeps
    // hitting the provider's status endpoint forever after completion.
    refetchInterval: (query) => {
      const state = query.state.data?.data?.state;
      if (state === "completed" || state === "failed" || state === "refunded") return false;
      return 8_000;
    },
  });
