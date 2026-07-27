import { STABLECOIN_SYMBOLS, WRAPPED_NATIVE_SYMBOLS, trendingConfig } from "@/config/trending";
import type { DexMarket, RiskFlag, ScoredMarket } from "./types";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function logNorm(value: number | null | undefined, ceiling: number): number | null {
  if (value === null || value === undefined || !Number.isFinite(value) || value < 0) return null;
  if (ceiling <= 0) return null;
  return clamp01(Math.log10(1 + value) / Math.log10(1 + ceiling));
}

function sumTx(counts: { buys: number | null; sells: number | null }): number | null {
  if (counts.buys === null && counts.sells === null) return null;
  return (counts.buys ?? 0) + (counts.sells ?? 0);
}

/**
 * Computes a transparent, platform-calculated trend score from real provider
 * values only. Returns `null` when too few components can be derived.
 */
export function scoreMarket(market: DexMarket): ScoredMarket {
  const n = trendingConfig.normalisation;

  // Volume acceleration: recent hourly rate vs 24h average hourly rate.
  let volumeAcceleration: number | null = null;
  if (market.volume.h1 !== null && market.volume.h24 !== null && market.volume.h24 > 0) {
    const avgHourly = market.volume.h24 / 24;
    if (avgHourly > 0) {
      volumeAcceleration = clamp01(market.volume.h1 / avgHourly / 4);
    }
  }

  const tx24 = sumTx(market.txns.h24);
  const transactionActivity = logNorm(tx24, n.transactions24hCeiling);
  const liquidity = logNorm(market.liquidityUsd, n.liquidityUsdCeiling);

  let momentum: number | null = null;
  if (market.priceChange.h24 !== null || market.priceChange.h6 !== null) {
    const blend =
      ((market.priceChange.h1 ?? 0) * 0.2 +
        (market.priceChange.h6 ?? 0) * 0.3 +
        (market.priceChange.h24 ?? 0) * 0.5) /
      n.momentumPercentCeiling;
    momentum = clamp01((blend + 1) / 2);
  }

  let buyPressure: number | null = null;
  const buys = market.txns.h24.buys;
  const sells = market.txns.h24.sells;
  if (buys !== null && sells !== null && buys + sells > 0) {
    buyPressure = clamp01(buys / (buys + sells));
  }

  // Consistency: activity present across multiple windows.
  const windows = [market.txns.m5, market.txns.h1, market.txns.h6, market.txns.h24]
    .map(sumTx)
    .filter((v): v is number => v !== null);
  const consistency = windows.length
    ? clamp01(windows.filter((v) => v > 0).length / windows.length)
    : null;

  const components: Record<string, number | null> = {
    volumeAcceleration,
    transactionActivity,
    liquidity,
    momentum,
    buyPressure,
    consistency,
  };

  const weights = trendingConfig.weights;
  let weightSum = 0;
  let scoreSum = 0;
  let present = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const value = components[key];
    if (value === null || value === undefined) continue;
    present += 1;
    weightSum += weight;
    scoreSum += value * weight;
  }

  const trendScore =
    present >= trendingConfig.minimumComponents && weightSum > 0
      ? Math.round((scoreSum / weightSum) * 1000) / 10
      : null;

  return { market, trendScore, components, risks: detectRisks(market, present) };
}

export function detectRisks(market: DexMarket, componentsPresent = 6): RiskFlag[] {
  const s = trendingConfig.safeguards;
  const risks: RiskFlag[] = [];

  if (componentsPresent < trendingConfig.minimumComponents) risks.push("limited_data");
  if (market.liquidityUsd !== null && market.liquidityUsd < s.lowLiquidityUsd)
    risks.push("low_liquidity");
  if (market.liquidityUsd !== null && market.liquidityUsd < s.minLiquidityUsd)
    risks.push("extremely_low_liquidity");
  if (market.liquidityUsd === null) risks.push("limited_data");

  const missingCore = [
    market.priceUsd,
    market.volume.h24,
    market.liquidityUsd,
    sumTx(market.txns.h24),
  ].filter((v) => v === null).length;
  if (missingCore >= 2) risks.push("incomplete_market_data");

  const change = market.priceChange.h24;
  if (change !== null && Math.abs(change) >= s.extremePriceChangePercent)
    risks.push("high_volatility");

  if (market.pairCreatedAt) {
    const ageMinutes = (Date.now() - market.pairCreatedAt) / 60000;
    if (ageMinutes < s.newPairAgeMinutes) risks.push("new_pair");
  }

  const buys = market.txns.h24.buys;
  const sells = market.txns.h24.sells;
  if (buys !== null && sells !== null && buys + sells > 20) {
    const ratio = sells === 0 ? Infinity : buys / sells;
    if (ratio >= s.buySellImbalanceRatio || ratio <= 1 / s.buySellImbalanceRatio)
      risks.push("buy_sell_imbalance");
  }

  if (
    market.volume.h24 !== null &&
    market.liquidityUsd !== null &&
    market.liquidityUsd > 0 &&
    market.volume.h24 / market.liquidityUsd >= s.suspiciousVolumeToLiquidityRatio
  ) {
    risks.push("suspicious_volume");
  }

  if (market.boostAmount && market.boostAmount > 0) risks.push("promotional_boost");
  risks.push("verification_unavailable");

  return Array.from(new Set(risks));
}

export interface TrendingFilterOptions {
  applySafeguards?: boolean;
}

/** Deduplicates, filters and ranks markets by the calculated trend score. */
export function rankMarkets(
  markets: DexMarket[],
  options: TrendingFilterOptions = {},
): ScoredMarket[] {
  const f = trendingConfig.filters;
  const s = trendingConfig.safeguards;
  let list = markets;

  if (f.excludeStablecoinBaseTokens) {
    list = list.filter(
      (m) => !STABLECOIN_SYMBOLS.includes((m.baseToken.symbol ?? "").toUpperCase()),
    );
  }
  if (f.excludeWrappedNativeBaseTokens) {
    list = list.filter(
      (m) => !WRAPPED_NATIVE_SYMBOLS.includes((m.baseToken.symbol ?? "").toUpperCase()),
    );
  }
  if (f.preferredQuoteSymbols.length) {
    const preferred = f.preferredQuoteSymbols.map((x) => x.toUpperCase());
    const filtered = list.filter((m) =>
      preferred.includes((m.quoteToken.symbol ?? "").toUpperCase()),
    );
    if (filtered.length) list = filtered;
  }

  if (options.applySafeguards) {
    list = list.filter((m) => {
      if (m.liquidityUsd !== null && m.liquidityUsd < s.minLiquidityUsd) return false;
      const tx = sumTx(m.txns.h24);
      if (tx !== null && tx < s.minTransactions24h) return false;
      if (m.pairCreatedAt && (Date.now() - m.pairCreatedAt) / 60000 < s.minPairAgeMinutes)
        return false;
      return true;
    });
  }

  if (f.deduplicateByBaseToken) {
    const best = new Map<string, DexMarket>();
    for (const m of list) {
      const key = `${m.chainId}:${m.baseToken.address.toLowerCase()}`;
      const current = best.get(key);
      if (!current || (m.liquidityUsd ?? 0) > (current.liquidityUsd ?? 0)) best.set(key, m);
    }
    list = Array.from(best.values());
  }

  return list.map(scoreMarket).sort((a, b) => (b.trendScore ?? -1) - (a.trendScore ?? -1));
}
