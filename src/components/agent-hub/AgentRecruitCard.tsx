import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentPortraitStage } from "./AgentPortraitStage";
import { RarityBadge } from "./RarityBadge";
import type { GenesisAgentConfig } from "@/config/genesisAgents";

export function AgentRecruitCard({
  agent,
  onRecruitClick,
}: {
  agent: GenesisAgentConfig;
  onRecruitClick: (agent: GenesisAgentConfig) => void;
}) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl">
      <div className="flex items-start justify-center">
        <AgentPortraitStage agent={agent} size="lg" />
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

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/70 pt-4">
        <div className="rounded-lg bg-secondary/60 px-3 py-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Price
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
            {agent.price} <span className="text-xs font-medium">{agent.paymentTokenSymbol}</span>
          </p>
        </div>
        <div className="rounded-lg bg-secondary/60 px-3 py-2 text-center">
          <p className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Zap className="size-2.5" aria-hidden="true" />
            Farming rate
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
            {agent.pulsePerHour}
            <span className="text-xs font-medium"> $PULSE/hr</span>
          </p>
        </div>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
        <dt className="text-muted-foreground">Maximum supply</dt>
        <dd className="text-right font-medium tabular-nums text-foreground">
          {agent.maxSupply.toLocaleString()}
        </dd>
        <dt className="text-muted-foreground">Wallet limit</dt>
        <dd className="text-right font-medium tabular-nums text-foreground">{agent.walletLimit}</dd>
      </dl>

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
