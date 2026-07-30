import { cn } from "@/lib/utils";
import type { AgentRarity } from "@/config/genesisAgents";

/**
 * Rarity is a systemic 6-tier scale, deliberately separate from each Genesis
 * Agent's own bespoke accent color (see genesisAgents.ts). Color alone never
 * carries the meaning — the tier name is always rendered as text too.
 */
const RARITY_CLASSES: Record<AgentRarity, string> = {
  Common: "bg-muted text-muted-foreground",
  Uncommon: "bg-positive/10 text-positive",
  Rare: "bg-agent-cyan/12 text-agent-cyan",
  Epic: "bg-agent-purple/12 text-agent-purple",
  Legendary: "bg-agent-gold/15 text-agent-gold-foreground",
  Mythic: "bg-agent-mythic/20 text-agent-mythic-foreground",
};

const RARITY_DOT: Record<AgentRarity, string> = {
  Common: "bg-muted-foreground",
  Uncommon: "bg-positive",
  Rare: "bg-agent-cyan",
  Epic: "bg-agent-purple",
  Legendary: "bg-agent-gold",
  Mythic: "bg-agent-mythic",
};

export function RarityBadge({ rarity, className }: { rarity: AgentRarity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
        RARITY_CLASSES[rarity],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", RARITY_DOT[rarity])} aria-hidden="true" />
      {rarity}
    </span>
  );
}
