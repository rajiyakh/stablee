import { queryOptions } from "@tanstack/react-query";
import { getEnvelope } from "@/lib/market/client";
import type { SwapTokenConfig } from "@/config/swapTokens";
import type { ZeroExPriceResponse, ZeroExQuoteResponse } from "./schemas";
import type { ValidateQuoteResult } from "./validateQuote";

/**
 * ZeroExPriceResponse/ZeroExQuoteResponse are discriminated unions (on
 * liquidityAvailable) inferred from a Zod z.union — `interface X extends`
 * cannot extend a union, so these are intersection types instead. `&`
 * distributes over `|` here, so `.liquidityAvailable` narrowing still works.
 */
export type SwapPriceData = ZeroExPriceResponse & {
  sellUsd: number | null;
  sellUsdSource: string | null;
  buyUsd: number | null;
  priceImpactBps: number | null;
  feeUsd: number | null;
  minSwapUsd: number;
  meetsMinimumSwap: boolean;
  validation: ValidateQuoteResult<ZeroExPriceResponse>;
};

export type SwapQuoteData = ZeroExQuoteResponse & {
  sellUsd: number | null;
  buyUsd: number | null;
  priceImpactBps: number | null;
  feeUsd: number | null;
  minSwapUsd: number;
  validation: ValidateQuoteResult<ZeroExQuoteResponse>;
};

export interface SwapRequestParams {
  sellToken: string;
  buyToken: string;
  sellAmount?: string;
  buyAmount?: string;
  taker?: string;
  slippageBps?: number;
}

function buildParams(params: SwapRequestParams): string {
  const q = new URLSearchParams();
  q.set("sellToken", params.sellToken);
  q.set("buyToken", params.buyToken);
  if (params.sellAmount) q.set("sellAmount", params.sellAmount);
  if (params.buyAmount) q.set("buyAmount", params.buyAmount);
  if (params.taker) q.set("taker", params.taker);
  if (params.slippageBps) q.set("slippageBps", String(params.slippageBps));
  return q.toString();
}

export const swapKeys = {
  price: (params: SwapRequestParams) => ["swap", "price", buildParams(params)] as const,
  quote: (params: SwapRequestParams) => ["swap", "quote", buildParams(params)] as const,
  tokens: ["swap", "tokens"] as const,
  resolveToken: (address: string) => ["swap", "resolve-token", address.toLowerCase()] as const,
};

/** Curated tokens merged with GMGN-discovered, on-chain-decimals-confirmed tokens. */
export const swapTokensQuery = () =>
  queryOptions({
    queryKey: swapKeys.tokens,
    queryFn: () => getEnvelope<SwapTokenConfig[]>("/api/swap/tokens"),
    staleTime: 60_000,
  });

/** Resolves a pasted contract address — curated/GMGN/direct-on-chain, see resolve-token.ts. */
export const resolveTokenQuery = (address: string, enabled: boolean) =>
  queryOptions({
    queryKey: swapKeys.resolveToken(address),
    queryFn: () =>
      getEnvelope<SwapTokenConfig | null>(
        `/api/swap/resolve-token?address=${encodeURIComponent(address)}`,
      ),
    enabled: enabled && /^0x[a-fA-F0-9]{40}$/.test(address),
    staleTime: 5 * 60_000,
    retry: false,
  });

export const swapPriceQuery = (params: SwapRequestParams, enabled: boolean) =>
  queryOptions({
    queryKey: swapKeys.price(params),
    queryFn: () => getEnvelope<SwapPriceData>(`/api/swap/price?${buildParams(params)}`),
    enabled:
      enabled &&
      Boolean(params.sellToken && params.buyToken && (params.sellAmount || params.buyAmount)),
    staleTime: 3_000,
    retry: false,
  });

export const swapQuoteQuery = (params: SwapRequestParams, enabled: boolean) =>
  queryOptions({
    queryKey: swapKeys.quote(params),
    queryFn: () => getEnvelope<SwapQuoteData>(`/api/swap/quote?${buildParams(params)}`),
    enabled:
      enabled &&
      Boolean(
        params.sellToken &&
        params.buyToken &&
        params.taker &&
        (params.sellAmount || params.buyAmount),
      ),
    staleTime: 0,
    retry: false,
  });
