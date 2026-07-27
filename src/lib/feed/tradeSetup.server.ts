import { getPoolOhlcv } from "@/lib/market/geckoterminal.server";
import { getAgent } from "@/lib/agents";
import type { ScoredMarket } from "@/lib/market/types";
import type { AgentTradeSetup } from "@/lib/calls/types";
import type { MarketEvent } from "./types";

const OHLCV_LOOKBACK_HOURS = 48;

/**
 * Builds a structured trade setup from real recent OHLCV (GeckoTerminal), when
 * a matching pool exists. Entry/target/invalidation are always derived from
 * real recent high/low + volatility — never invented. When no historical data
 * is available, returns a "watching" setup with no levels, per the platform's
 * anti-fabrication rule.
 */
export async function buildTradeSetup(
  event: MarketEvent,
  agentSlug: string,
  scored: ScoredMarket,
  networkId: string,
  direction: "long" | "short" | "watch" | "avoid",
): Promise<AgentTradeSetup> {
  const agent = getAgent(agentSlug);
  const market = scored.market;
  const referencePrice = market.priceUsd ?? 0;
  const base: AgentTradeSetup = {
    id: `${event.id}:${agentSlug}`,
    tokenAddress: market.baseToken.address,
    pairAddress: market.pairAddress,
    chainId: market.chainId,
    agentId: agentSlug,
    direction: "watch",
    referencePrice,
    confidence: 0,
    riskLevel: "moderate",
    horizonMinutes: agent?.timeHorizonMinutes ?? 60,
    reasoning: "Watching only — insufficient historical data for a structured entry.",
    supportingMetrics: {
      volume5m: market.volume.m5 ?? undefined,
      volume1h: market.volume.h1 ?? undefined,
      volume24h: market.volume.h24 ?? undefined,
      liquidityUsd: market.liquidityUsd ?? undefined,
      buys5m: market.txns.m5.buys ?? undefined,
      sells5m: market.txns.m5.sells ?? undefined,
      priceChange5m: market.priceChange.m5 ?? undefined,
      priceChange1h: market.priceChange.h1 ?? undefined,
      priceChange24h: market.priceChange.h24 ?? undefined,
      pairAgeMinutes: market.pairCreatedAt
        ? (Date.now() - market.pairCreatedAt) / 60000
        : undefined,
    },
    dataProvider: "GeckoTerminal",
    dataTimestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    status: "watching",
  };

  if (!referencePrice || direction === "watch" || direction === "avoid") {
    return { ...base, direction, reasoning: directionlessReason(direction) };
  }

  try {
    const res = await getPoolOhlcv(networkId, market.pairAddress);
    const points = res.data.slice(-OHLCV_LOOKBACK_HOURS);
    if (points.length < 12) {
      return base; // insufficient real history — stay in "watching" mode
    }

    const recentHigh = Math.max(...points.map((p) => p.high));
    const recentLow = Math.min(...points.map((p) => p.low));
    const range = recentHigh - recentLow;
    if (range <= 0) return base;

    const confidence = Math.max(0.1, Math.min(0.9, (scored.trendScore ?? 30) / 100));
    const hasHighRisk = scored.risks.some((r) =>
      [
        "high_volatility",
        "suspicious_volume",
        "extremely_low_liquidity",
        "sudden_liquidity_decline",
      ].includes(r),
    );
    const riskLevel: AgentTradeSetup["riskLevel"] = hasHighRisk
      ? "extreme"
      : agent?.riskProfile === "high"
        ? "high"
        : agent?.riskProfile === "low"
          ? "low"
          : "moderate";

    if (direction === "long") {
      return {
        ...base,
        direction,
        entryLow: Math.max(recentLow, referencePrice - range * 0.15),
        entryHigh: referencePrice,
        targetLow: referencePrice + range * 0.3,
        targetHigh: recentHigh,
        invalidationPrice: recentLow - range * 0.05,
        confidence,
        riskLevel,
        reasoning: `Conditional entry near current price, invalidated below the recent ${OHLCV_LOOKBACK_HOURS}h low. Possible target toward the recent range high — not a guaranteed outcome.`,
        status: "waiting_for_entry",
      };
    }

    return {
      ...base,
      direction,
      entryLow: referencePrice,
      entryHigh: Math.min(recentHigh, referencePrice + range * 0.15),
      targetLow: recentLow,
      targetHigh: referencePrice - range * 0.3,
      invalidationPrice: recentHigh + range * 0.05,
      confidence,
      riskLevel,
      reasoning: `Conditional short-side scenario, invalidated above the recent ${OHLCV_LOOKBACK_HOURS}h high. Possible target toward the recent range low — not a guaranteed outcome.`,
      status: "waiting_for_entry",
    };
  } catch {
    // No usable pool history from the configured provider — stay honest, don't invent levels.
    return base;
  }
}

function directionlessReason(direction: "long" | "short" | "watch" | "avoid"): string {
  return direction === "avoid"
    ? "Not suitable under current liquidity and risk conditions. Avoiding a directional call."
    : "Watching only — insufficient confirmation for a structured entry.";
}
