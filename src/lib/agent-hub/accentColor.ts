/** Per-agent bespoke accent token → real CSS color, used by AgentPortraitStage for the portrait glow/sweep/particle effects. Same token names as the rarity-tier map (RarityBadge.tsx/RarityFrame.tsx), just applied per-agent instead of per-tier. */
export const ACCENT_COLOR: Record<string, string> = {
  primary: "var(--color-primary)",
  brand: "var(--color-brand)",
  positive: "var(--color-positive)",
  warning: "var(--color-warning)",
  negative: "var(--color-negative)",
  "muted-foreground": "var(--color-muted-foreground)",
  "agent-cyan": "var(--color-agent-cyan)",
  "agent-purple": "var(--color-agent-purple)",
  "agent-gold": "var(--color-agent-gold)",
  "agent-mythic": "var(--color-agent-mythic)",
};
