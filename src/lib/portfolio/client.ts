import { queryOptions } from "@tanstack/react-query";
import { getEnvelope } from "@/lib/market/client";

export interface PortfolioHolding {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl: string | null;
  balance: string;
  balanceFormatted: string;
  priceUsd: number | null;
  valueUsd: number | null;
  isNative: boolean;
  /** Blockscout marked this token's reputation as something other than "ok" — shown, never hidden. */
  flagged: boolean;
}

export interface PortfolioData {
  address: string;
  totalUsd: number | null;
  holdings: PortfolioHolding[];
}

export const portfolioKeys = {
  holdings: (address: string) => ["portfolio", "holdings", address.toLowerCase()] as const,
};

export const portfolioHoldingsQuery = (address: string, enabled: boolean) =>
  queryOptions({
    queryKey: portfolioKeys.holdings(address),
    queryFn: () =>
      getEnvelope<PortfolioData>(`/api/portfolio/holdings?address=${encodeURIComponent(address)}`),
    enabled: enabled && /^0x[a-fA-F0-9]{40}$/.test(address),
    staleTime: 15_000,
    retry: false,
  });
