import type { MarketEvent, MarketEventType, AnalysisCategory } from "./types";
import { formatPercent, formatUsd } from "@/lib/market/format";

/** Deterministic string hash — same event id always picks the same template variant. */
function hashPick<T>(seed: string, options: T[]): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return options[h % options.length];
}

export interface AgentEventTemplate {
  category: AnalysisCategory;
  stance: "bullish" | "bearish" | "neutral" | "avoid";
  render: (e: MarketEvent) => string;
}

const pct = (v: number | null | undefined) => formatPercent(v ?? null);
const usd = (v: number | null | undefined) => formatUsd(v ?? null, { compact: true });
const sym = (e: MarketEvent) => e.token.symbol;

/** Relevant agents per event type, primary specialty first. Never a random pick. */
export const eventAgentMap: Record<MarketEventType, string[]> = {
  entered_trending: ["echo", "flowstate", "vector"],
  volume_spike_5m: ["flowstate", "vector", "atlas"],
  volume_spike_1h: ["vector", "flowstate"],
  liquidity_increase: ["flowstate", "ledger"],
  liquidity_decrease: ["ledger", "flowstate"],
  buy_sell_imbalance: ["flowstate", "parallax"],
  extreme_price_move: ["revert", "vector", "ledger"],
  new_pair_detected: ["echo", "ledger"],
  new_launch_trending: ["echo", "flowstate", "ledger", "vector", "revert", "parallax"],
  large_trade_activity: ["atlas", "ledger"],
  low_liquidity_attention: ["ledger", "parallax"],
  overextended: ["revert", "parallax"],
  risk_signal_appeared: ["ledger"],
  activity_slowdown: ["flowstate", "echo"],
  lost_trending: ["echo"],
};

type TemplateBank = Record<string, Partial<Record<MarketEventType, AgentEventTemplate[]>>>;

export const templateBank: TemplateBank = {
  vector: {
    volume_spike_1h: [
      {
        category: "momentum",
        stance: "bullish",
        render: (e) =>
          `${sym(e)} 1h volume is running well above its 24h average — momentum remains active, but I would not chase the current candle. A pullback into the prior range would offer a cleaner risk-defined setup.`,
      },
      {
        category: "momentum",
        stance: "neutral",
        render: (e) =>
          `Watching ${sym(e)} for continuation. Volume acceleration is real, but I want confirmation from transaction count before treating this as a structured breakout.`,
      },
    ],
    volume_spike_5m: [
      {
        category: "momentum",
        stance: "neutral",
        render: (e) =>
          `${sym(e)} just posted a sharp 5-minute volume increase (${usd(e.metrics.volume5m)}). Too early to call direction — waiting for the next window to confirm.`,
      },
    ],
    extreme_price_move: [
      {
        category: "momentum",
        stance: "neutral",
        render: (e) =>
          `${sym(e)} moved ${pct(e.metrics.priceChange24h)} over 24h. Momentum remains active but the move is extended — conditional entry only on a retrace.`,
      },
    ],
    new_launch_trending: [
      {
        category: "momentum",
        stance: "neutral",
        render: (e) =>
          `Evaluating ${sym(e)} for breakout conditions this early is speculative — pair age is under an hour. Momentum read stays provisional until more data accumulates.`,
      },
    ],
  },
  meridian: {},
  revert: {
    extreme_price_move: [
      {
        category: "reversion",
        stance: "bearish",
        render: (e) =>
          `${sym(e)} is already extended ${pct(e.metrics.priceChange24h)} beyond its recent range. I'm watching for a failed breakout rather than entering at the current price.`,
      },
      {
        category: "reversion",
        stance: "neutral",
        render: (e) =>
          `The move on ${sym(e)} looks overextended relative to participation. Reversion risk is elevated — not suitable for aggressive entries here.`,
      },
    ],
    overextended: [
      {
        category: "reversion",
        stance: "bearish",
        render: (e) =>
          `${sym(e)} has travelled far from its short-term average without matching transaction growth. Overextension conditions are forming.`,
      },
    ],
    new_launch_trending: [
      {
        category: "reversion",
        stance: "neutral",
        render: (e) =>
          `${sym(e)} is too fresh to evaluate for mean reversion — no meaningful average exists yet. Watching only.`,
      },
    ],
  },
  flowstate: {
    entered_trending: [
      {
        category: "liquidity",
        stance: "neutral",
        render: (e) =>
          `Checking whether ${sym(e)}'s volume is genuine. Liquidity currently sits at ${usd(e.metrics.liquidityUsd)} — transaction sample needs to grow before I'd treat this as confirmed flow.`,
      },
    ],
    volume_spike_5m: [
      {
        category: "liquidity",
        stance: "neutral",
        render: (e) =>
          `Buy activity on ${sym(e)} has increased, but the transaction sample remains small. I need sustained volume before treating this as confirmed momentum.`,
      },
    ],
    liquidity_increase: [
      {
        category: "liquidity",
        stance: "bullish",
        render: (e) =>
          `${sym(e)} liquidity has expanded to ${usd(e.metrics.liquidityUsd)}. Depth is improving, which reduces slippage risk for the current activity level.`,
      },
    ],
    liquidity_decrease: [
      {
        category: "liquidity",
        stance: "bearish",
        render: (e) =>
          `${sym(e)} liquidity has pulled back to ${usd(e.metrics.liquidityUsd)}. Depth quality is deteriorating — flagging for reduced position sizing.`,
      },
    ],
    buy_sell_imbalance: [
      {
        category: "liquidity",
        stance: "neutral",
        render: (e) =>
          `${sym(e)} is showing a one-sided buy/sell pattern. Flow imbalance alone isn't conclusive — depth and sustained activity matter more than a single window.`,
      },
    ],
    new_launch_trending: [
      {
        category: "liquidity",
        stance: "neutral",
        render: (e) =>
          `${sym(e)}'s early liquidity is ${usd(e.metrics.liquidityUsd)} against ${usd(e.metrics.volume5m)} in 5-minute volume. Turnover is high relative to depth — treating this cautiously.`,
      },
    ],
    activity_slowdown: [
      {
        category: "liquidity",
        stance: "neutral",
        render: (e) => `${sym(e)} activity has cooled meaningfully from its recent pace.`,
      },
    ],
  },
  ledger: {
    liquidity_decrease: [
      {
        category: "risk",
        stance: "bearish",
        render: (e) =>
          `Current liquidity on ${sym(e)} is too limited for aggressive positioning. A relatively small sell could produce significant slippage.`,
      },
    ],
    new_pair_detected: [
      {
        category: "risk",
        stance: "avoid",
        render: (e) =>
          `New pair detected: ${sym(e)}, ${e.metrics.pairAgeMinutes ?? "recent"}m old. No track record exists yet — elevated risk by default until more data accumulates.`,
      },
    ],
    new_launch_trending: [
      {
        category: "risk",
        stance: "avoid",
        render: (e) =>
          `${sym(e)} entered trending within an hour of launch. Liquidity: ${usd(e.metrics.liquidityUsd)}. Position sizing should stay conservative regardless of momentum.`,
      },
    ],
    large_trade_activity: [
      {
        category: "risk",
        stance: "neutral",
        render: (e) =>
          `Average trade size on ${sym(e)} has increased relative to its 24h baseline. Not inherently bearish, but worth watching for concentrated exit risk.`,
      },
    ],
    low_liquidity_attention: [
      {
        category: "risk",
        stance: "avoid",
        render: (e) =>
          `${sym(e)} is drawing attention on liquidity of only ${usd(e.metrics.liquidityUsd)}. Elevated risk — not suitable for meaningful size under current depth.`,
      },
    ],
    risk_signal_appeared: [
      {
        category: "risk",
        stance: "avoid",
        render: (e) =>
          `Risk flags active on ${sym(e)}. Applying the platform's safeguard thresholds — this does not mean the token is unsafe, only that current data warrants caution.`,
      },
    ],
  },
  echo: {
    entered_trending: [
      {
        category: "attention",
        stance: "neutral",
        render: (e) =>
          `${sym(e)} just entered the trending list. Attention is rotating toward it — checking whether the underlying activity is organic before drawing conclusions.`,
      },
    ],
    new_pair_detected: [
      {
        category: "attention",
        stance: "neutral",
        render: (e) => `New token discovered: ${sym(e)}. Adding to the monitoring list.`,
      },
    ],
    new_launch_trending: [
      {
        category: "attention",
        stance: "neutral",
        render: (e) =>
          `${sym(e)} launched and reached trending rank within an hour — rapid attention gain. Opening a thread to track how the other signals develop.`,
      },
    ],
    activity_slowdown: [
      {
        category: "attention",
        stance: "neutral",
        render: (e) => `Attention on ${sym(e)} is fading — activity has slowed from its peak.`,
      },
    ],
    lost_trending: [
      {
        category: "attention",
        stance: "neutral",
        render: (e) => `${sym(e)} has dropped out of the trending list.`,
      },
    ],
  },
  atlas: {
    volume_spike_5m: [
      {
        category: "whale_flow",
        stance: "neutral",
        render: (e) =>
          `Reviewing ${sym(e)}'s recent transactions — average trade size is elevated relative to the 24h baseline, consistent with larger participants entering.`,
      },
    ],
    large_trade_activity: [
      {
        category: "whale_flow",
        stance: "neutral",
        render: (e) =>
          `${sym(e)}: volume is growing faster than transaction count, implying larger average trade size. Individual wallet activity isn't available from the configured providers, so this is inferred, not confirmed.`,
      },
    ],
  },
  parallax: {
    buy_sell_imbalance: [
      {
        category: "contrarian",
        stance: "neutral",
        render: (e) =>
          `Most of the flow on ${sym(e)} is one-sided right now. I'd want to see liquidity expand at the same rate before trusting the direction.`,
      },
    ],
    new_launch_trending: [
      {
        category: "contrarian",
        stance: "avoid",
        render: (e) =>
          `Everyone's focused on ${sym(e)}'s launch speed. I'm more concerned that liquidity hasn't expanded to match the attention — crowded trades on thin depth tend to reverse fast.`,
      },
    ],
    overextended: [
      {
        category: "contrarian",
        stance: "bearish",
        render: (e) =>
          `${sym(e)} looks crowded at current levels. Challenging the prevailing read — this has the shape of a move that fades without new participation.`,
      },
    ],
    low_liquidity_attention: [
      {
        category: "contrarian",
        stance: "avoid",
        render: (e) =>
          `${sym(e)} is getting attention it can't support on current liquidity. Skeptical this holds without real depth behind it.`,
      },
    ],
  },
};

export function pickTemplate(agentSlug: string, event: MarketEvent): AgentEventTemplate | null {
  const forAgent = templateBank[agentSlug]?.[event.type];
  if (!forAgent || forAgent.length === 0) return null;
  return hashPick(event.id + agentSlug, forAgent);
}
