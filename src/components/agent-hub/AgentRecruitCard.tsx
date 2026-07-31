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
    <article className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl">
      <div className="relative mx-auto w-fit">
        <AgentPortraitStage agent={agent} size="lg" />
        <span
          className="absolute left-1.5 top-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm"
          style={{ color: accent, borderColor: accent, backgroundColor: "var(--color-card)" }}
        >
          {tierLabel}
        </span>
      </div>

      <div className="mt-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
          <RarityBadge rarity={agent.rarity} />
        </div>
        <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{agent.role}</p>
      </div>

      <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
        {agent.shortDescription}
      </p>

      <div className="mt-4 text-center">
        <p className="text-3xl font-bold leading-none tabular-nums" style={{ color: accent }}>
          {agent.pulsePerDay}
        </p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          $PULSE / day
        </p>
      </div>

      <div className="mt-3">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            aria-hidden="true"
            className="animate-bar-shimmer absolute inset-y-0 w-1/3 rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }}
          />
        </div>
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">0 recruited</p>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Price{" "}
        <span className="font-semibold tabular-nums text-foreground">
          {agent.price} {agent.paymentTokenSymbol}
        </span>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/70 pt-4">
        <div className="rounded-lg bg-secondary/60 px-3 py-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Max Supply
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
            {agent.maxSupply.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-secondary/60 px-3 py-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Wallet Limit
          </p>
          <p className="mt-0.5 text-sm font-bold text-foreground">{AGENT_HUB_WALLET_LIMIT_LABEL}</p>
        </div>
      </div>

      <div className="mt-4 flex-1" />

      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          className="w-full"
          disabled={!agent.enabled}
          onClick={() => onRecruitClick(agent)}
        >
          Recruitment Coming Soon
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to="/app/agents-hub/$slug" params={{ slug: agent.slug }}>
            View Details
          </Link>
        </Button>
      </div>
    </article>
  );
}
