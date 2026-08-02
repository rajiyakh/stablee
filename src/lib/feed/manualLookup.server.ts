/**
 * On-demand, single-token analysis for a user-pasted contract address — the
 * manual counterpart to engine.server.ts's cron-driven event detection.
 *
 * The batch engine only ever classifies an event by diffing a token's fresh
 * scan against its own prior scan (store.tokenMemory) — a token pasted for
 * the first time has no history to diff against, so it can never produce a
 * "detected event" the existing way. classifyColdTokenEvent() below is the
 * one genuinely new piece: it picks the single most relevant event type
 * from the token's own *current* signals (real risk flags / trend score,
 * nothing invented), mirroring the priority order engine.server.ts already
 * uses for a token it has never observed before (detectEvents's `!prev`
 * branch). Everything downstream (eventAgentMap, pickTemplate,
 * computeConsensus, buildTradeSetup) is reused unchanged from engine.server.ts.
 */
import { randomUUID } from "node:crypto";
import { getTokenPairs } from "@/lib/market/dexscreener.server";
import { scoreMarket } from "@/lib/market/trending";
import { formatPercent, formatUsd } from "@/lib/market/format";
import { newLaunchConfig } from "@/config/newLaunches";
import { feedConfig } from "@/config/feed";
import { pickTemplate, eventAgentMap } from "./templates";
import { computeConsensus } from "./consensus";
import { buildTradeSetup } from "./tradeSetup.server";
import type { ScoredMarket } from "@/lib/market/types";
import type {
  AgentMessage,
  ConsensusSummary,
  MarketEvent,
  MarketEventType,
  TokenRef,
} from "./types";

export interface ManualLookupSuccess {
  ok: true;
  token: TokenRef;
  event: MarketEvent;
  messages: AgentMessage[];
  consensus: ConsensusSummary;
  dataProvider: string;
  fetchedAt: string;
  stale: boolean;
}

export interface ManualLookupFailure {
  ok: false;
  code: "not_found" | "no_analysis";
  message: string;
}

export type ManualLookupResult = ManualLookupSuccess | ManualLookupFailure;

/** Trend score above which a cold token reads as "would rank in the top trending tier." */
const ENTERED_TRENDING_SCORE = 55;

function robinhoodNetworkId(): string {
  return (process.env.GECKOTERMINAL_ROBINHOOD_NETWORK_ID ?? "").trim();
}

function stanceToDirection(stance: AgentMessage["stance"]): "long" | "short" | "watch" | "avoid" {
  if (stance === "bullish") return "long";
  if (stance === "bearish") return "short";
  if (stance === "avoid") return "avoid";
  return "watch";
}

/**
 * Priority mirrors engine.server.ts's detectEvents() "!prev" (never-seen-
 * before) branch: a brand-new pair or a strongly-trending score is reported
 * first, then real risk signals, in the same order the batch risk-diff
 * branch checks them. Returns null (rather than forcing a misleading
 * template) when the token shows no signal strong enough to justify any of
 * the existing event framings.
 */
export function classifyColdTokenEvent(scored: ScoredMarket): MarketEventType | null {
  const { risks, trendScore } = scored;

  if (risks.includes("new_pair")) return "new_pair_detected";
  if (
    (trendScore ?? 0) >= ENTERED_TRENDING_SCORE &&
    (scored.market.liquidityUsd ?? 0) >= newLaunchConfig.minimumLiquidityUsd
  ) {
    return "entered_trending";
  }
  if (risks.includes("buy_sell_imbalance")) return "buy_sell_imbalance";
  if (risks.includes("high_volatility")) return "extreme_price_move";
  if (risks.includes("extremely_low_liquidity") || risks.includes("low_liquidity")) {
    return "low_liquidity_attention";
  }
  return null;
}

function toRef(scored: ScoredMarket): TokenRef {
  const market = scored.market;
  return {
    chainId: market.chainId,
    address: market.baseToken.address,
    pairAddress: market.pairAddress,
    symbol: market.baseToken.symbol ?? "UNKNOWN",
    name: market.baseToken.name ?? market.baseToken.symbol ?? "Unknown token",
  };
}

function buildEvent(
  type: MarketEventType,
  scored: ScoredMarket,
  dataTimestamp: string,
): MarketEvent {
  const market = scored.market;
  return {
    id: `manual-${market.chainId}-${market.baseToken.address.toLowerCase()}-${Date.now()}`,
    type,
    token: toRef(scored),
    detectedAt: new Date().toISOString(),
    dataProvider: market.source === "geckoterminal" ? "GeckoTerminal" : "DEX Screener",
    dataTimestamp,
    metrics: {
      priceUsd: market.priceUsd,
      liquidityUsd: market.liquidityUsd,
      volume5m: market.volume.m5,
      volume1h: market.volume.h1,
      volume24h: market.volume.h24,
      priceChange5m: market.priceChange.m5,
      priceChange1h: market.priceChange.h1,
      priceChange24h: market.priceChange.h24,
      pairAgeMinutes: market.pairCreatedAt ? (Date.now() - market.pairCreatedAt) / 60000 : null,
    },
    trendScore: scored.trendScore,
    riskFlags: scored.risks,
  };
}

async function buildMessages(event: MarketEvent, scored: ScoredMarket): Promise<AgentMessage[]> {
  const candidateAgents = eventAgentMap[event.type] ?? [];
  const selected = candidateAgents.slice(0, feedConfig.maxAgentsPerEvent);
  const networkId = robinhoodNetworkId();
  const messages: AgentMessage[] = [];

  for (const agentSlug of selected) {
    const template = pickTemplate(agentSlug, event);
    if (!template) continue;

    const confidence = Math.max(0.15, Math.min(0.9, (event.trendScore ?? 35) / 100));
    const hasHighRisk = event.riskFlags.some((r) =>
      [
        "high_volatility",
        "suspicious_volume",
        "extremely_low_liquidity",
        "sudden_liquidity_decline",
      ].includes(r),
    );

    const message: AgentMessage = {
      id: randomUUID(),
      eventId: event.id,
      agentSlug,
      token: event.token,
      category: template.category,
      content: template.render(event),
      confidence,
      riskLevel: hasHighRisk ? "extreme" : template.stance === "avoid" ? "high" : "moderate",
      riskFlags: event.riskFlags,
      metrics: [
        { label: "Liquidity", value: formatUsd(event.metrics.liquidityUsd, { compact: true }) },
        { label: "24h volume", value: formatUsd(event.metrics.volume24h, { compact: true }) },
        { label: "24h change", value: formatPercent(event.metrics.priceChange24h, 1) },
      ],
      dataProvider: event.dataProvider,
      dataTimestamp: event.dataTimestamp,
      createdAt: new Date().toISOString(),
      stance: template.stance,
    };

    if (agentSlug === "vector" || agentSlug === "revert") {
      const direction = stanceToDirection(template.stance);
      message.tradeSetup = await buildTradeSetup(event, agentSlug, scored, networkId, direction);
    }

    messages.push(message);
  }

  return messages;
}

export async function buildManualAgentPost(
  chainId: string,
  address: string,
): Promise<ManualLookupResult> {
  const result = await getTokenPairs(chainId, address);
  const top = [...result.data].sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0))[0];

  if (!top) {
    return {
      ok: false,
      code: "not_found",
      message: "No trading pairs were found for this token on Robinhood Mainnet.",
    };
  }

  const scored = scoreMarket(top);
  const eventType = classifyColdTokenEvent(scored);
  if (!eventType) {
    return {
      ok: false,
      code: "no_analysis",
      message:
        "This token doesn't show a signal strong enough yet for an agent read — no unusual risk, volatility, or trending activity detected.",
    };
  }

  const event = buildEvent(eventType, scored, result.fetchedAt);
  const messages = await buildMessages(event, scored);
  if (messages.length === 0) {
    return {
      ok: false,
      code: "no_analysis",
      message: "No agent templates are available for this token's current read yet.",
    };
  }

  return {
    ok: true,
    token: event.token,
    event,
    messages,
    consensus: computeConsensus(event.token, messages),
    dataProvider: event.dataProvider,
    fetchedAt: result.fetchedAt,
    stale: result.stale,
  };
}
