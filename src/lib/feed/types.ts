import type { AgentTradeSetup, CallTimelineStage } from "@/lib/calls/types";
import type { RiskFlag } from "@/lib/market/types";

export type MarketEventType =
  | "entered_trending"
  | "volume_spike_5m"
  | "volume_spike_1h"
  | "liquidity_increase"
  | "liquidity_decrease"
  | "buy_sell_imbalance"
  | "extreme_price_move"
  | "new_pair_detected"
  | "new_launch_trending"
  | "large_trade_activity"
  | "low_liquidity_attention"
  | "overextended"
  | "risk_signal_appeared"
  | "activity_slowdown"
  | "lost_trending";

export interface TokenRef {
  chainId: string;
  address: string;
  pairAddress: string;
  symbol: string;
  name: string;
}

export interface MarketEvent {
  id: string;
  type: MarketEventType;
  token: TokenRef;
  detectedAt: string;
  dataProvider: string;
  dataTimestamp: string;
  /** Real metric values that justified this event — never invented. */
  metrics: Record<string, number | null>;
  trendScore: number | null;
  riskFlags: RiskFlag[];
}

export type AnalysisCategory =
  | "momentum"
  | "liquidity"
  | "risk"
  | "reversion"
  | "attention"
  | "whale_flow"
  | "contrarian"
  | "correlation";

export interface AgentMessage {
  id: string;
  eventId: string;
  agentSlug: string;
  token: TokenRef;
  category: AnalysisCategory;
  content: string;
  confidence: number;
  riskLevel: "low" | "moderate" | "high" | "extreme";
  riskFlags: RiskFlag[];
  metrics: Array<{ label: string; value: string }>;
  dataProvider: string;
  dataTimestamp: string;
  createdAt: string;
  tradeSetup?: AgentTradeSetup;
  stance: "bullish" | "bearish" | "neutral" | "avoid";
}

export type ThreadStatus =
  | "monitoring"
  | "setup_forming"
  | "trade_active"
  | "risk_escalated"
  | "invalidated"
  | "target_reached"
  | "closed"
  | "insufficient_data";

export interface FeedThread {
  id: string;
  token: TokenRef;
  status: ThreadStatus;
  triggerEventId: string;
  messageIds: string[];
  timeline: Array<{ stage: CallTimelineStage; at: string }>;
  updatedAt: string;
}

export type ConsensusLabel =
  | "strong_bullish"
  | "moderate_bullish"
  | "neutral"
  | "moderate_bearish"
  | "strong_bearish"
  | "avoid"
  | "insufficient_data";

export interface ConsensusSummary {
  token: TokenRef;
  label: ConsensusLabel;
  bullishAgents: string[];
  bearishAgents: string[];
  neutralAgents: string[];
  avoidAgents: string[];
  averageConfidence: number | null;
  riskOverride: boolean;
  updatedAt: string;
}

export interface TrendingTokenInfo extends TokenRef {
  rank: number;
  priceUsd: number | null;
  priceChange1h: number | null;
  volume24h: number | null;
  liquidityUsd: number | null;
  trendScore: number | null;
  riskFlags: RiskFlag[];
}

export interface NewLaunchInfo extends TokenRef {
  pairAgeMinutes: number;
  priceUsd: number | null;
  volumeSinceLaunch: number | null;
  liquidityUsd: number | null;
  buys: number | null;
  sells: number | null;
  priceChange1h: number | null;
  trendingRank: number | null;
  riskFlags: RiskFlag[];
  trendingWithinOneHour: boolean;
}

export interface FeedSnapshot {
  generatedAt: string;
  messages: AgentMessage[];
  threads: FeedThread[];
  consensusByToken: Record<string, ConsensusSummary>;
  trendingTokens: TrendingTokenInfo[];
  newLaunches: NewLaunchInfo[];
  activeAgentCount: number;
  tokensMonitored: number;
  robinhoodConfigured: boolean;
}
