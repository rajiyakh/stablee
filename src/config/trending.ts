/**
 * Transparent trending / scoring configuration.
 *
 * Every weight and threshold here is configurable by the owner. The trend
 * score is a PLATFORM-CALCULATED metric — never a provider-supplied value —
 * and is only computed when enough real inputs are present.
 */

export const trendingConfig = {
  /** Weights must sum to 1. */
  weights: {
    volumeAcceleration: 0.25,
    transactionActivity: 0.2,
    liquidity: 0.2,
    momentum: 0.15,
    buyPressure: 0.1,
    consistency: 0.1,
  },

  /** Minimum number of scorable components before a trend score is shown. */
  minimumComponents: 4,

  /** Anti-manipulation safeguards. */
  safeguards: {
    minLiquidityUsd: 5_000,
    minPairAgeMinutes: 60,
    minTransactions24h: 25,
    extremePriceChangePercent: 60,
    suspiciousVolumeToLiquidityRatio: 25,
    lowLiquidityUsd: 25_000,
    newPairAgeMinutes: 60 * 24,
    buySellImbalanceRatio: 5,
  },

  /** Normalisation ceilings (values above are clamped to 1). */
  normalisation: {
    liquidityUsdCeiling: 2_000_000,
    volume24hCeiling: 5_000_000,
    transactions24hCeiling: 5_000,
    momentumPercentCeiling: 25,
  },

  /** Filtering options. */
  filters: {
    excludeStablecoinBaseTokens: true,
    excludeWrappedNativeBaseTokens: true,
    preferredQuoteSymbols: [] as string[],
    deduplicateByBaseToken: true,
  },

  /** Promotional boosts are surfaced separately, never folded into the score. */
  treatBoostsAsPromotional: true,
} as const;

export const scoringConfig = {
  minimumScoredCalls: 10,
  weights: {
    directionalAccuracy: 0.35,
    riskAdjustedReturn: 0.25,
    targetEfficiency: 0.15,
    confidenceCalibration: 0.15,
    consistency: 0.1,
  },
} as const;

export const cacheConfig = {
  priceSeconds: 45,
  trendingSeconds: 180,
  metadataSeconds: 2700,
  chartSeconds: 600,
  statusSeconds: 600,
} as const;

export const TREND_SCORE_TOOLTIP =
  "Trending rank is calculated from live trading activity, volume, liquidity, momentum, and transaction data. Promotional boosts are identified separately.";

export const STABLECOIN_SYMBOLS = [
  "USDT",
  "USDC",
  "DAI",
  "TUSD",
  "USDE",
  "FDUSD",
  "PYUSD",
  "USDS",
  "BUSD",
  "FRAX",
  "LUSD",
];

export const WRAPPED_NATIVE_SYMBOLS = ["WETH", "WBNB", "WMATIC", "WAVAX", "WSOL", "WBTC"];
