/**
 * AI analyst agent roster.
 *
 * Agents carry ONLY static methodology descriptions. Performance figures are
 * never fabricated: until real scored calls exist, every statistic resolves to
 * zero or "Not enough data".
 */

export interface Agent {
  slug: string;
  name: string;
  role: string;
  focus: string;
  summary: string;
  methodology: string[];
  signals: string[];
  inputs: string[];
  limitations: string;
  accent: string;
  /** Lucide icon name used for the agent's abstract avatar (no photos, no copied characters). */
  icon: string;
  /** Typical risk level of the scenarios this agent tends to propose. */
  riskProfile: "low" | "moderate" | "high";
  /** Typical scenario duration this agent reasons over, in minutes. */
  timeHorizonMinutes: number;
}

export const agents: Agent[] = [
  {
    slug: "vector",
    name: "Vector",
    role: "Momentum & breakouts",
    focus: "Directional expansion",
    summary:
      "Watches for expansion in trading range, volume and transaction count occurring together, and flags the moment a market leaves its recent equilibrium.",
    methodology: [
      "Compares 1-hour volume against the 24-hour hourly average to detect acceleration.",
      "Requires transaction counts to rise alongside volume before treating a move as a breakout.",
      "Discards moves that occur on liquidity below the configured safeguard threshold.",
    ],
    signals: ["Momentum signal", "Breakout alert", "Volume anomaly"],
    inputs: ["Volume windows", "Transaction windows", "Price change windows", "Liquidity"],
    limitations:
      "Breakout observations degrade sharply on thin markets and cannot anticipate off-chain news.",
    accent: "primary",
    icon: "TrendingUp",
    riskProfile: "moderate",
    timeHorizonMinutes: 120,
  },
  {
    slug: "meridian",
    name: "Meridian",
    role: "Tokenized equities & correlation",
    focus: "Tokenized-equity structure",
    summary:
      "Focuses on tokenized-equity markets and how their on-chain pricing behaves relative to available reference data.",
    methodology: [
      "Only analyses assets present in an owner-verified tokenized-equity registry.",
      "Reads price, volume and market capitalisation from the resolving provider record.",
      "Never asserts backing, redemption, issuer or regulatory status without a verifiable source.",
    ],
    signals: ["Tokenized-stock correlation analysis", "Market observation", "Market recap"],
    inputs: ["Verified registry", "CoinGecko market data", "Contract metadata"],
    limitations:
      "Remains inactive until a verified tokenized-equity registry with resolvable identifiers is configured.",
    accent: "primary",
    icon: "GitCompare",
    riskProfile: "low",
    timeHorizonMinutes: 1440,
  },
  {
    slug: "revert",
    name: "Revert",
    role: "Mean reversion",
    focus: "Overextension",
    summary:
      "Identifies markets that have travelled far from their short-term average without matching participation.",
    methodology: [
      "Contrasts the 24-hour price change against 1-hour and 6-hour changes.",
      "Treats extension without transaction growth as fragile.",
      "Weights liquidity depth when judging how far a market can retrace.",
    ],
    signals: ["Market observation", "Bearish call", "Bullish call"],
    inputs: ["Price change windows", "Transaction windows", "Liquidity"],
    limitations: "Reversion logic is unreliable during sustained directional regimes.",
    accent: "warning",
    icon: "RotateCcw",
    riskProfile: "moderate",
    timeHorizonMinutes: 60,
  },
  {
    slug: "flowstate",
    name: "FlowState",
    role: "Liquidity & transaction flow",
    focus: "Depth quality",
    summary:
      "Measures how much real depth stands behind a market and whether trading flow is balanced.",
    methodology: [
      "Compares 24-hour volume against pool liquidity to gauge turnover intensity.",
      "Tracks buy/sell counts for one-sided flow.",
      "Flags markets where turnover far exceeds available depth.",
    ],
    signals: ["Liquidity warning", "Whale-flow observation", "Market observation"],
    inputs: ["Liquidity", "Volume windows", "Buy/sell counts"],
    limitations:
      "Holder concentration is not derivable from the configured providers and is never estimated.",
    accent: "primary",
    icon: "Waves",
    riskProfile: "low",
    timeHorizonMinutes: 90,
  },
  {
    slug: "ledger",
    name: "Ledger",
    role: "Risk & volatility",
    focus: "Downside conditions",
    summary:
      "Applies the platform's configurable safeguard thresholds and publishes the resulting risk picture.",
    methodology: [
      "Evaluates every market against minimum liquidity, pair age and transaction thresholds.",
      "Escalates when absolute price change exceeds the configured volatility limit.",
      "Never labels any market as safe.",
    ],
    signals: ["Risk warning", "Volatility alert", "Liquidity warning"],
    inputs: ["Safeguard configuration", "Liquidity", "Price change", "Pair age"],
    limitations: "Cannot verify contract source code or ownership from the configured providers.",
    accent: "negative",
    icon: "ShieldAlert",
    riskProfile: "low",
    timeHorizonMinutes: 60,
  },
  {
    slug: "echo",
    name: "Echo",
    role: "Market attention & trend velocity",
    focus: "Attention shifts",
    summary:
      "Tracks how quickly attention rotates between markets, separating organic activity from promoted placement.",
    methodology: [
      "Uses the platform trend score, which excludes promotional boosts.",
      "Reports boost presence as a distinct, clearly labelled promotional factor.",
      "Compares activity across the 5-minute, 1-hour, 6-hour and 24-hour windows.",
    ],
    signals: ["Momentum signal", "Market observation", "Market recap"],
    inputs: ["Trend score components", "Boost data", "Transaction windows"],
    limitations: "Attention is not a valuation and promoted listings are not endorsements.",
    accent: "brand",
    icon: "Radar",
    riskProfile: "high",
    timeHorizonMinutes: 30,
  },
  {
    slug: "atlas",
    name: "Atlas",
    role: "Large trade & whale flow",
    focus: "Size imbalance",
    summary:
      "Looks for periods where volume grows much faster than transaction count, implying larger average trade size.",
    methodology: [
      "Derives average trade size from volume divided by transaction count per window.",
      "Compares short windows against the 24-hour baseline.",
      "Requires both volume and transaction data to be present before publishing.",
    ],
    signals: ["Whale-flow observation", "Volume anomaly", "Market observation"],
    inputs: ["Volume windows", "Transaction windows"],
    limitations: "Individual wallet activity is not available from the configured providers.",
    accent: "primary",
    icon: "Anchor",
    riskProfile: "moderate",
    timeHorizonMinutes: 180,
  },
  {
    slug: "parallax",
    name: "Parallax",
    role: "Contrarian analysis",
    focus: "Crowd positioning",
    summary:
      "Argues the other side of consensus when flow, liquidity and price disagree with each other.",
    methodology: [
      "Seeks divergence between price direction and buy/sell balance.",
      "Discounts moves supported only by promotional visibility.",
      "Publishes explicit invalidation conditions with every directional view.",
    ],
    signals: ["Bearish call", "Bullish call", "Reply"],
    inputs: ["Buy/sell counts", "Price change windows", "Boost data"],
    limitations: "Contrarian views are frequently early and require explicit invalidation levels.",
    accent: "warning",
    icon: "Shuffle",
    riskProfile: "high",
    timeHorizonMinutes: 240,
  },
];

export function getAgent(slug: string): Agent | undefined {
  return agents.find((a) => a.slug === slug);
}

export interface AgentStats {
  totalCalls: number;
  scoredCalls: number;
  accuracy: number | null;
  averageReturn: number | null;
  currentStreak: number | null;
}

/** No real call history exists yet — every derived statistic is explicitly empty. */
export function emptyAgentStats(): AgentStats {
  return {
    totalCalls: 0,
    scoredCalls: 0,
    accuracy: null,
    averageReturn: null,
    currentStreak: null,
  };
}
