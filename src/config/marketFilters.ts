import type { RobinhoodHotSearchToken, RobinhoodTrendingToken } from "@/types/gmgn";

/**
 * Every filter here corresponds to a field GMGN's rank/hot-searches API
 * actually returns (see src/types/gmgn.ts). No filter is offered for data
 * the provider doesn't supply for Robinhood Mainnet.
 */
export interface MarketFilterState {
  minMarketCapUsd?: number;
  maxMarketCapUsd?: number;
  minLiquidityUsd?: number;
  maxLiquidityUsd?: number;
  minVolumeUsd?: number;
  minTransactions?: number;
  minHolders?: number;
  maxAgeSeconds?: number;
  verifiedOnly?: boolean;
  excludeHoneypots?: boolean;
  excludeUnpaid?: boolean;
  excludeLowLiquidity?: boolean;
  minBuySellRatio?: number;
  /** Hot Searches only. */
  minSearchHeat?: number;
}

export const DEFAULT_MARKET_FILTERS: MarketFilterState = {};

export interface MarketFilterDefinition {
  key: keyof MarketFilterState;
  label: string;
  type: "number" | "boolean";
  appliesTo: Array<"trending" | "hot-searches">;
  description: string;
  /** True when GMGN has no confirmed backing field — the control renders but cannot be applied. */
  disabled?: boolean;
}

export const MARKET_FILTER_DEFINITIONS: MarketFilterDefinition[] = [
  {
    key: "minMarketCapUsd",
    label: "Min market cap",
    type: "number",
    appliesTo: ["trending", "hot-searches"],
    description: "Hide tokens below this market cap.",
  },
  {
    key: "maxMarketCapUsd",
    label: "Max market cap",
    type: "number",
    appliesTo: ["trending", "hot-searches"],
    description: "Hide tokens above this market cap.",
  },
  {
    key: "minLiquidityUsd",
    label: "Min liquidity",
    type: "number",
    appliesTo: ["trending", "hot-searches"],
    description: "Hide tokens below this pool liquidity.",
  },
  {
    key: "maxLiquidityUsd",
    label: "Max liquidity",
    type: "number",
    appliesTo: ["trending", "hot-searches"],
    description: "Hide tokens above this pool liquidity.",
  },
  {
    key: "minVolumeUsd",
    label: "Min volume",
    type: "number",
    appliesTo: ["trending", "hot-searches"],
    description: "Hide tokens below this interval volume.",
  },
  {
    key: "minTransactions",
    label: "Min transactions",
    type: "number",
    appliesTo: ["trending", "hot-searches"],
    description: "Hide tokens below this interval transaction count.",
  },
  {
    key: "minHolders",
    label: "Min holders",
    type: "number",
    appliesTo: ["trending", "hot-searches"],
    description: "Hide tokens below this holder count.",
  },
  {
    key: "maxAgeSeconds",
    label: "Max age",
    type: "number",
    appliesTo: ["trending", "hot-searches"],
    description: "Hide pairs older than this age.",
  },
  {
    key: "verifiedOnly",
    label: "Verified only",
    type: "boolean",
    appliesTo: ["trending", "hot-searches"],
    description: "Show only tokens with renounced mint and freeze authority.",
  },
  {
    key: "excludeHoneypots",
    label: "Exclude honeypots",
    type: "boolean",
    appliesTo: ["trending", "hot-searches"],
    description: "Hide tokens GMGN flags as honeypots.",
  },
  {
    key: "excludeUnpaid",
    label: "Exclude unpaid fees",
    type: "boolean",
    appliesTo: ["trending", "hot-searches"],
    description:
      "Not yet available — GMGN does not return an unpaid-listing field for Robinhood Mainnet.",
    disabled: true,
  },
  {
    key: "excludeLowLiquidity",
    label: "Exclude low liquidity",
    type: "boolean",
    appliesTo: ["trending", "hot-searches"],
    description: "Hide tokens with liquidity under $1,000.",
  },
  {
    key: "minBuySellRatio",
    label: "Min buy/sell ratio",
    type: "number",
    appliesTo: ["trending", "hot-searches"],
    description: "Hide tokens with fewer buys than sells by this ratio.",
  },
  {
    key: "minSearchHeat",
    label: "Min search heat",
    type: "number",
    appliesTo: ["hot-searches"],
    description: "Hide tokens below this GMGN search visit count.",
  },
];

const LOW_LIQUIDITY_THRESHOLD_USD = 1000;

/**
 * A "min X" filter can only match tokens where the field is present — GMGN
 * not returning a field is never treated as satisfying (or failing) a
 * threshold by fabricating a zero. Missing fields are excluded from a min
 * filter (their standing against the threshold is unknown) and pass through
 * unaffected by max filters and boolean filters unless the flag is itself present.
 */
export function applyMarketFilters<T extends RobinhoodTrendingToken>(
  tokens: T[],
  filters: MarketFilterState,
): T[] {
  return tokens.filter((token) => {
    if (filters.minMarketCapUsd !== undefined) {
      if (token.marketCapUsd === undefined || token.marketCapUsd < filters.minMarketCapUsd)
        return false;
    }
    if (filters.maxMarketCapUsd !== undefined) {
      if (token.marketCapUsd !== undefined && token.marketCapUsd > filters.maxMarketCapUsd)
        return false;
    }
    if (filters.minLiquidityUsd !== undefined) {
      if (token.liquidityUsd === undefined || token.liquidityUsd < filters.minLiquidityUsd)
        return false;
    }
    if (filters.maxLiquidityUsd !== undefined) {
      if (token.liquidityUsd !== undefined && token.liquidityUsd > filters.maxLiquidityUsd)
        return false;
    }
    if (filters.minVolumeUsd !== undefined) {
      const volume = currentIntervalVolume(token);
      if (volume === undefined || volume < filters.minVolumeUsd) return false;
    }
    if (filters.minTransactions !== undefined) {
      const tx = currentIntervalTransactions(token);
      if (tx === undefined || tx < filters.minTransactions) return false;
    }
    if (filters.minHolders !== undefined) {
      if (token.holders === undefined || token.holders < filters.minHolders) return false;
    }
    if (filters.maxAgeSeconds !== undefined) {
      if (token.ageSeconds !== undefined && token.ageSeconds > filters.maxAgeSeconds) return false;
    }
    if (filters.verifiedOnly && !token.security?.renounced) return false;
    if (filters.excludeHoneypots && token.security?.honeypot) return false;
    // excludeUnpaid is intentionally not applied: GMGN's confirmed Robinhood
    // fields carry no "unpaid listing" signal to filter on honestly. The
    // control should render disabled in the UI until such a field exists.
    if (filters.excludeLowLiquidity) {
      if (token.liquidityUsd === undefined || token.liquidityUsd < LOW_LIQUIDITY_THRESHOLD_USD)
        return false;
    }
    if (filters.minBuySellRatio !== undefined) {
      const buys = token.buys1h ?? token.buys1m;
      const sells = token.sells1h ?? token.sells1m;
      if (buys === undefined || sells === undefined) return false;
      const ratio = sells === 0 ? Number.POSITIVE_INFINITY : buys / sells;
      if (ratio < filters.minBuySellRatio) return false;
    }
    if (filters.minSearchHeat !== undefined) {
      const heat = (token as unknown as RobinhoodHotSearchToken).searchHeat ?? token.visitingCount;
      if (heat === undefined || heat < filters.minSearchHeat) return false;
    }
    return true;
  });
}

function currentIntervalVolume(token: RobinhoodTrendingToken): number | undefined {
  return (
    token.volume1hUsd ??
    token.volume24hUsd ??
    token.volume6hUsd ??
    token.volume5mUsd ??
    token.volume1mUsd
  );
}

function currentIntervalTransactions(token: RobinhoodTrendingToken): number | undefined {
  return (
    token.transactions1h ??
    token.transactions24h ??
    token.transactions6h ??
    token.transactions5m ??
    token.transactions1m
  );
}
