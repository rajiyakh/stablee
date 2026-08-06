import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AgentPortraitStage } from "./AgentPortraitStage";
import { RarityBadge } from "./RarityBadge";
import { AGENT_HUB_WALLET_LIMIT_LABEL } from "@/config/agentHub";
import { ACCENT_COLOR } from "@/lib/agent-hub/accentColor";
import { getRateTierLabel } from "@/lib/agent-hub/rateEfficiency";
import type { GenesisAgentConfig } from "@/config/genesisAgents";

export function AgentRecruitCard({
  agent,
  onRecruitClick,
}: {
  agent: GenesisAgentConfig;
  onRecruitClick: (agent: GenesisAgentConfig) => void;
}) {
  const accent = ACCENT_COLOR[agent.accent] ?? ACCENT_COLOR.primary;
  const tierLabel = getRateTierLabel(agent);

  return (
    <article className="card-surface group flex flex-col gap-2.5 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <Link
        to="/app/agents-hub/$slug"
        params={{ slug: agent.slug }}
        className="flex items-start gap-2.5"
      >
        <div className="relative shrink-0">
          <AgentPortraitStage agent={agent} size="sm" />
          <span
            className="absolute -left-1 -top-1 rounded-full border px-1 py-px text-[6px] font-bold uppercase tracking-wide shadow-sm"
            style={{ color: accent, borderColor: accent, backgroundColor: "var(--color-card)" }}
          >
            {tierLabel}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
            {agent.name}
          </h3>
          <RarityBadge rarity={agent.rarity} className="mt-1 px-1.5 py-0 text-[9px]" />
          <p className="mt-1 truncate text-[10px] uppercase tracking-wide text-muted-foreground">
            {agent.role}
          </p>
        </div>
      </Link>

      <div className="flex items-baseline justify-between gap-2 border-t border-border/70 pt-2">
        <p className="text-sm font-bold tabular-nums text-foreground">
          {agent.price} {agent.paymentTokenSymbol}
        </p>
        <p className="text-[11px] font-semibold tabular-nums" style={{ color: accent }}>
          {agent.pulsePerDay} $ORCA/day
        </p>
      </div>

      <p className="text-[10px] leading-tight text-muted-foreground">
        0 / {agent.maxSupply.toLocaleString()} minted · {AGENT_HUB_WALLET_LIMIT_LABEL}
      </p>

      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={!agent.enabled}
        onClick={() => onRecruitClick(agent)}
      >
        Minting Soon
      </Button>
    </article>
  );
}
