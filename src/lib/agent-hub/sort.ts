import type { GenesisAgentConfig } from "@/config/genesisAgents";

export type AgentSortKey = "price" | "rarity" | "farming-rate" | "supply";

/** Rarity ordering, low → high, for consistent sort direction regardless of tier count. */
const RARITY_ORDER: Record<GenesisAgentConfig["rarity"], number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
  Mythic: 5,
};

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const comparators: Record<AgentSortKey, (a: GenesisAgentConfig, b: GenesisAgentConfig) => number> =
  {
    price: (a, b) => toNumber(a.price) - toNumber(b.price),
    rarity: (a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity],
    "farming-rate": (a, b) => toNumber(a.pulsePerHour) - toNumber(b.pulsePerHour),
    supply: (a, b) => a.maxSupply - b.maxSupply,
  };

export function sortGenesisAgents(
  agents: GenesisAgentConfig[],
  key: AgentSortKey,
  direction: "asc" | "desc" = "asc",
): GenesisAgentConfig[] {
  const sorted = [...agents].sort(comparators[key]);
  return direction === "asc" ? sorted : sorted.reverse();
}
