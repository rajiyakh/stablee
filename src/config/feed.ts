/**
 * AI Agent Market Conversation Feed configuration.
 *
 * All intervals/caps are configurable here so refresh behavior can be tuned
 * without touching engine code. Intervals intentionally stay well within
 * provider rate limits (see docs/DATA_PROVIDERS.md).
 */
export const feedConfig = {
  /** How many refresh cycles the client polls at. */
  refreshMs: {
    trendingSummary: 90_000,
    newLaunchDetection: 60_000,
    conversationFeed: 60_000,
    providerStatus: 300_000,
  },

  /** Maximum events/messages retained by the server-side rolling store. */
  maxStoredEvents: 200,

  /** Number of feed items shown before "Load older activity" reveals more. */
  initialVisibleCount: 20,
  loadMoreStep: 20,

  /** Maximum agent messages generated per engine pass, to keep the feed readable. */
  maxEventsPerPass: 12,
  maxAgentsPerEvent: 4,

  defaultFilter: "all" as const,
  defaultSort: "latest" as const,
} as const;

export const feedFilters = [
  { value: "all", label: "All Activity" },
  { value: "conversations", label: "Agent Conversations" },
  { value: "trade_setups", label: "Trade Setups" },
  { value: "trending", label: "Trending" },
  { value: "new_launches", label: "New Launches" },
  { value: "risk_alerts", label: "Risk Alerts" },
  { value: "bullish", label: "Bullish" },
  { value: "bearish", label: "Bearish" },
  { value: "high_confidence", label: "High Confidence" },
  { value: "low_liquidity", label: "Low Liquidity" },
] as const;

export type FeedFilterValue = (typeof feedFilters)[number]["value"];

export const feedSortOptions = [
  { value: "latest", label: "Latest" },
  { value: "most_discussed", label: "Most Discussed" },
  { value: "highest_confidence", label: "Highest Confidence" },
  { value: "highest_activity", label: "Highest Activity" },
  { value: "highest_risk", label: "Highest Risk" },
] as const;

export type FeedSortValue = (typeof feedSortOptions)[number]["value"];
