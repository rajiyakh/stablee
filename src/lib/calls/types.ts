/**
 * Data model for agent-published market calls.
 *
 * No publishing backend exists yet — these types define the shape a future
 * scoring/persistence service must produce. Nothing in this file creates,
 * stores, or fabricates a call. Every UI that consumes `MarketCall` must
 * treat an empty list as "no calls published", never render placeholder rows.
 */

export type CallDirection = "long" | "short" | "neutral";

export type CallStatus = "pending" | "tracking" | "hit" | "missed" | "invalidated" | "expired";

export type CallTimeHorizon = "intraday" | "swing" | "position";

export interface MarketCall {
  id: string;
  asset: {
    kind: "coin" | "dex";
    id: string;
    symbol: string;
    name: string;
    chainId?: string;
    address?: string;
  };
  agentSlug: string;
  direction: CallDirection;
  confidence: number;
  referencePrice: number;
  target: number | null;
  invalidation: number | null;
  timeHorizon: CallTimeHorizon;
  evidence: string[];
  dataProvider: string;
  publishedAt: string;
  trackingStart: string;
  expiresAt: string | null;
  status: CallStatus;
  finalResult: {
    exitPrice: number;
    returnPercent: number;
    closedAt: string;
  } | null;
  score: number | null;
}

/** Append-only record of a status transition. Calls are never edited in place. */
export interface CallEvent {
  callId: string;
  status: CallStatus;
  at: string;
  note?: string;
}

/**
 * A structured trade scenario embedded in a feed message. Distinct from
 * `MarketCall` (the long-lived, scored record a Leaderboard would rank):
 * an `AgentTradeSetup` is the feed-native, real-time-generated shape the
 * conversation engine produces per token per agent pass.
 */
export type TradeSetupStatus =
  | "watching"
  | "waiting_for_entry"
  | "active"
  | "target_reached"
  | "invalidated"
  | "expired"
  | "cancelled";

export interface AgentTradeSetup {
  id: string;
  tokenAddress: string;
  pairAddress?: string;
  chainId: string;

  agentId: string;
  direction: "long" | "short" | "avoid" | "watch";

  referencePrice: number;
  entryLow?: number;
  entryHigh?: number;
  targetLow?: number;
  targetHigh?: number;
  invalidationPrice?: number;

  confidence: number;
  riskLevel: "low" | "moderate" | "high" | "extreme";
  horizonMinutes: number;

  reasoning: string;
  supportingMetrics: {
    volume5m?: number;
    volume1h?: number;
    volume24h?: number;
    liquidityUsd?: number;
    buys5m?: number;
    sells5m?: number;
    priceChange5m?: number;
    priceChange1h?: number;
    priceChange24h?: number;
    pairAgeMinutes?: number;
  };

  dataProvider: string;
  dataTimestamp: string;
  createdAt: string;

  status: TradeSetupStatus;
}

/** Visual timeline stages for a tracked thread/setup. */
export type CallTimelineStage =
  | "detected"
  | "published"
  | "entry_triggered"
  | "updated"
  | "target_reached"
  | "invalidated"
  | "expired"
  | "scored";
