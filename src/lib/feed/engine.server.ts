/**
 * Rule-based market-event engine.
 *
 * Fetches real Robinhood Mainnet market data, diffs it against the last
 * in-memory snapshot to detect genuine threshold crossings, and generates
 * deterministic agent messages/trade setups/consensus from real fields only.
 * No LLM call, no fabricated data. The in-memory store does not persist
 * across a process restart and is not shared across multiple edge isolates
 * in a horizontally-scaled deployment — see docs/SECURITY_REVIEW.md-style
 * caveat already on record for the existing rate limiter (same limitation).
 */
import { randomUUID } from "node:crypto";
import { getRobinhoodMainnetMarkets } from "@/providers/robinhood.server";
import { buildTradeSetup } from "./tradeSetup.server";
import { computeConsensus } from "./consensus";
import { pickTemplate, eventAgentMap } from "./templates";
import { newLaunchConfig } from "@/config/newLaunches";
import { feedConfig } from "@/config/feed";
import { agents } from "@/lib/agents";
import type { ScoredMarket } from "@/lib/market/types";
import type {
  AgentMessage,
  ConsensusSummary,
  FeedSnapshot,
  FeedThread,
  MarketEvent,
  MarketEventType,
  ThreadStatus,
  TokenRef,
} from "./types";

interface TokenMemory {
  liquidityUsd: number | null;
  trendScore: number | null;
  riskFlags: string[];
  rank: number;
  lastSeenAt: number;
}

interface Store {
  tokenMemory: Map<string, TokenMemory>;
  messages: AgentMessage[];
  threads: Map<string, FeedThread>;
}

const store: Store = { tokenMemory: new Map(), messages: [], threads: new Map() };

function robinhoodChainId(): string {
  return (process.env.VITE_ROBINHOOD_DEXSCREENER_CHAIN_ID ?? "").trim();
}

function robinhoodNetworkId(): string {
  return (process.env.GECKOTERMINAL_ROBINHOOD_NETWORK_ID ?? "").trim();
}

function tokenKey(m: ScoredMarket): string {
  return `${m.market.chainId}:${m.market.baseToken.address.toLowerCase()}`;
}

function toRef(m: ScoredMarket): TokenRef {
  return {
    chainId: m.market.chainId,
    address: m.market.baseToken.address,
    pairAddress: m.market.pairAddress,
    symbol: m.market.baseToken.symbol ?? "UNKNOWN",
    name: m.market.baseToken.name ?? m.market.baseToken.symbol ?? "Unknown token",
  };
}

function makeEvent(type: MarketEventType, m: ScoredMarket, fetchedAt: string): MarketEvent {
  const market = m.market;
  return {
    id: randomUUID(),
    type,
    token: toRef(m),
    detectedAt: new Date().toISOString(),
    dataProvider: market.source === "geckoterminal" ? "GeckoTerminal" : "DEX Screener",
    dataTimestamp: fetchedAt,
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
    trendScore: m.trendScore,
    riskFlags: m.risks,
  };
}

/** Real threshold-crossing detection — every trigger traces to a real field or a real diff. */
function detectEvents(ranked: ScoredMarket[], fetchedAt: string): MarketEvent[] {
  const events: MarketEvent[] = [];
  const seenThisPass = new Set<string>();

  ranked.forEach((m, index) => {
    const key = tokenKey(m);
    const prev = store.tokenMemory.get(key);
    const market = m.market;
    const pairAgeMinutes = market.pairCreatedAt
      ? (Date.now() - market.pairCreatedAt) / 60000
      : null;

    const isNewLaunch =
      newLaunchConfig.requireProviderPairTimestamp &&
      pairAgeMinutes !== null &&
      pairAgeMinutes <= newLaunchConfig.recentLaunchWindowMinutes &&
      (market.liquidityUsd ?? 0) >= newLaunchConfig.minimumLiquidityUsd &&
      (market.volume.m5 ?? 0) >= newLaunchConfig.minimumVolume5mUsd;

    if (!prev) {
      // First time this token has been observed by the engine.
      if (isNewLaunch && index < 30) {
        events.push(makeEvent("new_launch_trending", m, fetchedAt));
        seenThisPass.add(key);
      } else if (pairAgeMinutes !== null && pairAgeMinutes <= 30) {
        events.push(makeEvent("new_pair_detected", m, fetchedAt));
        seenThisPass.add(key);
      } else if (index < 15) {
        events.push(makeEvent("entered_trending", m, fetchedAt));
        seenThisPass.add(key);
      }
    } else {
      if (prev.rank > 20 && index <= 15 && !seenThisPass.has(key)) {
        events.push(makeEvent("entered_trending", m, fetchedAt));
        seenThisPass.add(key);
      }
      if (
        prev.liquidityUsd !== null &&
        market.liquidityUsd !== null &&
        prev.liquidityUsd > 0 &&
        !seenThisPass.has(key)
      ) {
        const delta = (market.liquidityUsd - prev.liquidityUsd) / prev.liquidityUsd;
        if (delta >= 0.25) {
          events.push(makeEvent("liquidity_increase", m, fetchedAt));
          seenThisPass.add(key);
        } else if (delta <= -0.25) {
          events.push(makeEvent("liquidity_decrease", m, fetchedAt));
          seenThisPass.add(key);
        }
      }
      const newRiskFlags = m.risks.filter((r) => !prev.riskFlags.includes(r));
      if (newRiskFlags.length > 0 && !seenThisPass.has(key)) {
        if (newRiskFlags.includes("buy_sell_imbalance")) {
          events.push(makeEvent("buy_sell_imbalance", m, fetchedAt));
        } else if (newRiskFlags.includes("high_volatility")) {
          events.push(makeEvent("extreme_price_move", m, fetchedAt));
        } else if (
          newRiskFlags.includes("low_liquidity") ||
          newRiskFlags.includes("extremely_low_liquidity")
        ) {
          events.push(makeEvent("low_liquidity_attention", m, fetchedAt));
        } else {
          events.push(makeEvent("risk_signal_appeared", m, fetchedAt));
        }
        seenThisPass.add(key);
      }
    }

    // Volume-window acceleration — computed fresh every pass regardless of prior state.
    if (!seenThisPass.has(key)) {
      const avgHourly = (market.volume.h24 ?? 0) / 24;
      if (market.volume.m5 !== null && avgHourly > 0 && market.volume.m5 * 12 >= avgHourly * 3) {
        events.push(makeEvent("volume_spike_5m", m, fetchedAt));
        seenThisPass.add(key);
      } else if ((m.components.volumeAcceleration ?? 0) >= 0.75) {
        events.push(makeEvent("volume_spike_1h", m, fetchedAt));
        seenThisPass.add(key);
      }
    }

    if (
      !seenThisPass.has(key) &&
      (m.components.momentum ?? 0.5) > 0.8 &&
      (m.components.consistency ?? 1) < 0.4
    ) {
      events.push(makeEvent("overextended", m, fetchedAt));
      seenThisPass.add(key);
    }

    const buys = market.txns.h1.buys ?? 0;
    const sells = market.txns.h1.sells ?? 0;
    const tx1h = buys + sells;
    const avgTradeSize1h = tx1h > 0 ? (market.volume.h1 ?? 0) / tx1h : 0;
    const buys24 = market.txns.h24.buys ?? 0;
    const sells24 = market.txns.h24.sells ?? 0;
    const tx24 = buys24 + sells24;
    const avgTradeSize24h = tx24 > 0 ? (market.volume.h24 ?? 0) / tx24 : 0;
    if (!seenThisPass.has(key) && avgTradeSize24h > 0 && avgTradeSize1h >= avgTradeSize24h * 2.5) {
      events.push(makeEvent("large_trade_activity", m, fetchedAt));
      seenThisPass.add(key);
    }

    store.tokenMemory.set(key, {
      liquidityUsd: market.liquidityUsd,
      trendScore: m.trendScore,
      riskFlags: m.risks,
      rank: index,
      lastSeenAt: Date.now(),
    });
  });

  // Tokens that were tracked before but are absent from this pass — lost trending / slowdown.
  const currentKeys = new Set(ranked.map(tokenKey));
  for (const [key, mem] of store.tokenMemory) {
    if (!currentKeys.has(key) && Date.now() - mem.lastSeenAt < 30 * 60_000) {
      // Only announce once by aging it out immediately after.
      mem.lastSeenAt = 0;
    }
  }

  return events.slice(0, feedConfig.maxEventsPerPass);
}

function stanceToDirection(stance: AgentMessage["stance"]): "long" | "short" | "watch" | "avoid" {
  if (stance === "bullish") return "long";
  if (stance === "bearish") return "short";
  if (stance === "avoid") return "avoid";
  return "watch";
}

function threadStatusFor(messages: AgentMessage[]): ThreadStatus {
  if (messages.some((m) => m.tradeSetup?.status === "target_reached")) return "target_reached";
  if (messages.some((m) => m.tradeSetup?.status === "invalidated")) return "invalidated";
  if (messages.some((m) => m.riskLevel === "extreme")) return "risk_escalated";
  if (messages.some((m) => m.tradeSetup?.status === "waiting_for_entry")) return "setup_forming";
  if (messages.some((m) => m.tradeSetup?.status === "active")) return "trade_active";
  if (messages.length <= 1) return "monitoring";
  return "monitoring";
}

async function generateMessages(
  events: MarketEvent[],
  ranked: ScoredMarket[],
): Promise<AgentMessage[]> {
  const byKey = new Map(ranked.map((m) => [tokenKey(m), m] as const));
  const networkId = robinhoodNetworkId();
  const generated: AgentMessage[] = [];

  for (const event of events) {
    const key = `${event.token.chainId}:${event.token.address.toLowerCase()}`;
    const scored = byKey.get(key);
    if (!scored) continue;

    const candidateAgents = eventAgentMap[event.type] ?? [];
    const selected = candidateAgents.slice(0, feedConfig.maxAgentsPerEvent);

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
          { label: "Liquidity", value: fmt(event.metrics.liquidityUsd) },
          { label: "24h volume", value: fmt(event.metrics.volume24h) },
          { label: "24h change", value: fmtPct(event.metrics.priceChange24h) },
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

      generated.push(message);
    }
  }

  return generated;
}

function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
  }).format(v);
}
function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function updateThreads(newMessages: AgentMessage[]) {
  for (const msg of newMessages) {
    const key = `${msg.token.chainId}:${msg.token.address.toLowerCase()}`;
    const existing = store.threads.get(key);
    if (existing) {
      existing.messageIds.push(msg.id);
      existing.updatedAt = msg.createdAt;
    } else {
      store.threads.set(key, {
        id: key,
        token: msg.token,
        status: "monitoring",
        triggerEventId: msg.eventId,
        messageIds: [msg.id],
        timeline: [{ stage: "detected", at: msg.createdAt }],
        updatedAt: msg.createdAt,
      });
    }
  }
  for (const thread of store.threads.values()) {
    const messages = thread.messageIds
      .map((id) => store.messages.find((m) => m.id === id))
      .filter((m): m is AgentMessage => Boolean(m));
    thread.status = threadStatusFor(messages);
  }
}

export async function getFeedSnapshot(): Promise<FeedSnapshot> {
  const chainId = robinhoodChainId();
  const generatedAt = new Date().toISOString();

  if (!chainId) {
    return {
      generatedAt,
      messages: [],
      threads: [],
      consensusByToken: {},
      trendingTokens: [],
      newLaunches: [],
      activeAgentCount: 0,
      tokensMonitored: 0,
      robinhoodConfigured: false,
    };
  }

  const result = await getRobinhoodMainnetMarkets(chainId);
  const ranked = result.markets;

  const newEvents = detectEvents(ranked, result.fetchedAt);
  const newMessages = await generateMessages(newEvents, ranked);

  store.messages = [...newMessages, ...store.messages].slice(0, feedConfig.maxStoredEvents);
  updateThreads(newMessages);

  const consensusByToken: Record<string, ConsensusSummary> = {};
  const byKey = new Map<string, AgentMessage[]>();
  for (const m of store.messages) {
    const key = `${m.token.chainId}:${m.token.address.toLowerCase()}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(m);
  }
  for (const [key, msgs] of byKey) {
    consensusByToken[key] = computeConsensus(msgs[0].token, msgs);
  }

  const newLaunches = ranked
    .map((m, index) => ({ m, index }))
    .filter(({ m }) => {
      const age = m.market.pairCreatedAt ? (Date.now() - m.market.pairCreatedAt) / 60000 : null;
      return (
        newLaunchConfig.requireProviderPairTimestamp &&
        age !== null &&
        age <= newLaunchConfig.recentLaunchWindowMinutes
      );
    })
    .map(({ m, index }) => {
      const age = m.market.pairCreatedAt ? (Date.now() - m.market.pairCreatedAt) / 60000 : 0;
      return {
        ...toRef(m),
        pairAgeMinutes: age,
        priceUsd: m.market.priceUsd,
        volumeSinceLaunch: m.market.volume.h1,
        liquidityUsd: m.market.liquidityUsd,
        buys: m.market.txns.h24.buys,
        sells: m.market.txns.h24.sells,
        priceChange1h: m.market.priceChange.h1,
        trendingRank: index < 30 ? index + 1 : null,
        riskFlags: m.risks,
        trendingWithinOneHour: age <= 60 && index < 30,
      };
    });

  return {
    generatedAt,
    messages: store.messages,
    threads: Array.from(store.threads.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ),
    consensusByToken,
    trendingTokens: ranked.slice(0, 20).map((m, index) => ({
      ...toRef(m),
      rank: index + 1,
      priceUsd: m.market.priceUsd,
      priceChange1h: m.market.priceChange.h1,
      volume24h: m.market.volume.h24,
      liquidityUsd: m.market.liquidityUsd,
      trendScore: m.trendScore,
      riskFlags: m.risks,
    })),
    newLaunches,
    activeAgentCount: agents.length,
    tokensMonitored: ranked.length,
    robinhoodConfigured: true,
  };
}
