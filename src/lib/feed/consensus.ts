import { getAgent } from "@/lib/agents";
import type { AgentMessage, ConsensusLabel, ConsensusSummary, TokenRef } from "./types";

const SPECIALTY_WEIGHT: Partial<Record<string, number>> = {
  ledger: 1.4, // risk agent carries extra weight in consensus, per spec's "risk override" rule
};

/**
 * Weighted consensus — never a plain unweighted vote. Considers agent
 * confidence, specialty relevance (risk agent weighted higher), and whether
 * any high-risk stance should override an otherwise bullish read.
 */
export function computeConsensus(token: TokenRef, messages: AgentMessage[]): ConsensusSummary {
  const now = new Date().toISOString();
  if (messages.length === 0) {
    return {
      token,
      label: "insufficient_data",
      bullishAgents: [],
      bearishAgents: [],
      neutralAgents: [],
      avoidAgents: [],
      averageConfidence: null,
      riskOverride: false,
      updatedAt: now,
    };
  }

  const bullish: string[] = [];
  const bearish: string[] = [];
  const neutral: string[] = [];
  const avoid: string[] = [];

  let weightedScore = 0;
  let weightSum = 0;
  let confidenceSum = 0;

  for (const m of messages) {
    const weight = SPECIALTY_WEIGHT[m.agentSlug] ?? 1;
    const direction = m.stance === "bullish" ? 1 : m.stance === "bearish" ? -1 : 0;
    weightedScore += direction * m.confidence * weight;
    weightSum += weight;
    confidenceSum += m.confidence;

    if (m.stance === "bullish") bullish.push(m.agentSlug);
    else if (m.stance === "bearish") bearish.push(m.agentSlug);
    else if (m.stance === "avoid") avoid.push(m.agentSlug);
    else neutral.push(m.agentSlug);
  }

  const riskOverride = messages.some(
    (m) => m.agentSlug === "ledger" && (m.riskLevel === "high" || m.riskLevel === "extreme"),
  );

  const normalized = weightSum > 0 ? weightedScore / weightSum : 0;
  const averageConfidence = confidenceSum / messages.length;

  let label: ConsensusLabel;
  if (avoid.length > bullish.length && avoid.length > bearish.length) {
    label = "avoid";
  } else if (normalized >= 0.4) {
    label = "strong_bullish";
  } else if (normalized >= 0.12) {
    label = "moderate_bullish";
  } else if (normalized <= -0.4) {
    label = "strong_bearish";
  } else if (normalized <= -0.12) {
    label = "moderate_bearish";
  } else {
    label = "neutral";
  }

  return {
    token,
    label,
    bullishAgents: Array.from(new Set(bullish)),
    bearishAgents: Array.from(new Set(bearish)),
    neutralAgents: Array.from(new Set(neutral)),
    avoidAgents: Array.from(new Set(avoid)),
    averageConfidence,
    riskOverride,
    updatedAt: now,
  };
}

export function agentDisplayName(slug: string): string {
  return getAgent(slug)?.name ?? slug;
}
