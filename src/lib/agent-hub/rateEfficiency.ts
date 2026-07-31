import { genesisAgentRegistry, type GenesisAgentConfig } from "@/config/genesisAgents";

/**
 * $PULSE earned per ETH spent — a genuine derived comparison (pulsePerDay ÷
 * price), not an invented figure. Surfaced on recruit cards as a "rate tier"
 * concept: see docs/AGENT_ECONOMY_CONFIG.md.
 */
export function calculatePulsePerEth(agent: GenesisAgentConfig): number {
  return Number(agent.pulsePerDay) / Number(agent.price);
}

function efficiencyRange(): { min: number; max: number } {
  const values = genesisAgentRegistry.map(calculatePulsePerEth);
  return { min: Math.min(...values), max: Math.max(...values) };
}

/**
 * "BASE RATE" for the registry's lowest $PULSE-per-ETH tier, "+N% RATE" for
 * the rest (rounded vs. the minimum), and the maximum gets a "★ ... BEST
 * RATE" treatment.
 */
export function getRateTierLabel(agent: GenesisAgentConfig): string {
  const { min, max } = efficiencyRange();
  const value = calculatePulsePerEth(agent);

  if (value <= min) return "BASE RATE";

  const percentAboveBase = Math.round(((value - min) / min) * 100);
  const label = `+${percentAboveBase}% RATE`;
  return value >= max ? `★ ${label} · BEST RATE` : label;
}
