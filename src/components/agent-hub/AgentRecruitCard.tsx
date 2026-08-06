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
    <article className="card-surface group flex flex-col gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <Link
        to="/app/agents-hub/$slug"
        params={{ slug: agent.slug }}
        className="flex items-start gap-3"
      >
        <div className="relative shrink-0">
          <AgentPortraitStage agent={agent} size="md" />
          <span
            className="absolute -left-1.5 -top-1.5 rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide shadow-sm"
            style={{ color: accent, borderColor: accent, backgroundColor: "var(--color-card)" }}
          >
            {tierLabel}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary">
            {agent.name}
          </h3>
          <RarityBadge rarity={agent.rarity} className="mt-1.5" />
          <p className="mt-1.5 truncate text-xs uppercase tracking-wide text-muted-foreground">
            {agent.role}
          </p>
        </div>
      </Link>

      <div className="flex items-baseline justify-between gap-2 border-t border-border/70 pt-3">
        <p className="text-base font-bold tabular-nums text-foreground">
          {agent.price} {agent.paymentTokenSymbol}
        </p>
        <p className="text-sm font-semibold tabular-nums" style={{ color: accent }}>
          {agent.pulsePerDay} $ORCA/day
        </p>
      </div>

      <p className="text-xs leading-tight text-muted-foreground">
        0 / {agent.maxSupply.toLocaleString()} minted · {AGENT_HUB_WALLET_LIMIT_LABEL}
      </p>

      <Button
        type="button"
        className="w-full"
        disabled={!agent.enabled}
        onClick={() => onRecruitClick(agent)}
      >
        Minting Soon
      </Button>
    </article>
  );
}
