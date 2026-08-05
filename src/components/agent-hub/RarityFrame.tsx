import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AgentRarity } from "@/config/genesisAgents";

/** Subtle per-rarity ring around a portrait — a hint, never a competing visual. */
const RARITY_RING: Record<AgentRarity, string> = {
  Common: "ring-border",
  Uncommon: "ring-positive/30",
  Rare: "ring-agent-cyan/30",
  Epic: "ring-agent-purple/30",
  Legendary: "ring-agent-gold/35",
  Mythic: "ring-agent-mythic/45",
};

export function RarityFrame({
  rarity,
  children,
  className,
}: {
  rarity: AgentRarity;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card backdrop-blur-sm p-1.5 ring-2 ring-inset",
        RARITY_RING[rarity],
        className,
      )}
    >
      {children}
    </div>
  );
}
