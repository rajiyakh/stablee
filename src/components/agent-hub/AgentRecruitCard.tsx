import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AgentPortrait } from "./AgentPortrait";
import { RarityFrame } from "./RarityFrame";
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
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <RarityFrame rarity={agent.rarity} className="mx-auto">
          <AgentPortrait src={agent.avatarPath} name={agent.name} size="md" />
        </RarityFrame>
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

      <dl className="mt-4 grid grid-cols-2 gap-y-2 border-t border-border/70 pt-4 text-xs">
        <dt className="text-muted-foreground">Price</dt>
        <dd className="text-right font-medium tabular-nums text-foreground">
          {agent.price} {agent.paymentTokenSymbol}
        </dd>
        <dt className="text-muted-foreground">Farming rate</dt>
        <dd className="text-right font-medium tabular-nums text-foreground">
          {agent.pulsePerHour} $PULSE/hr ({agent.farmingMultiplier}x)
        </dd>
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
