import {
  Anchor,
  Bot,
  GitCompare,
  Radar,
  RotateCcw,
  Shuffle,
  ShieldAlert,
  TrendingUp,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/agents";

/** Only the icons actually referenced by an agent — avoids bundling the full lucide-react set. */
const agentIcons: Record<string, LucideIcon> = {
  TrendingUp,
  GitCompare,
  RotateCcw,
  Waves,
  ShieldAlert,
  Radar,
  Anchor,
  Shuffle,
};

const accentClass: Record<string, string> = {
  primary: "bg-primary/12 text-primary",
  warning: "bg-warning/15 text-warning-foreground",
  negative: "bg-negative/10 text-negative",
  brand: "bg-brand/20 text-brand-foreground",
};

/** Abstract geometric avatar — icon + agent accent color. No photos, no copied characters. */
export function AgentAvatar({
  agent,
  size = "md",
  className,
}: {
  agent: Pick<Agent, "icon" | "accent" | "name">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = agentIcons[agent.icon] ?? Bot;
  const dims = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const iconDims = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        dims,
        accentClass[agent.accent] ?? accentClass.primary,
        className,
      )}
      aria-hidden="true"
    >
      <Icon className={iconDims} />
    </span>
  );
}
