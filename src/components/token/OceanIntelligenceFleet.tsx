import { Link } from "@tanstack/react-router";
import { SectionHeading } from "@/components/common/SectionHeading";
import { AgentPortrait } from "@/components/agent-hub/AgentPortrait";
import { RarityBadge } from "@/components/agent-hub/RarityBadge";
import { genesisAgentRegistry } from "@/config/genesisAgents";

export function OceanIntelligenceFleet() {
  return (
    <section id="fleet" className="mt-16">
      <SectionHeading eyebrow="The Fleet" title="Ocean Intelligence Fleet" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {genesisAgentRegistry.map((agent) => (
          <Link
            key={agent.slug}
            to="/app/agents-hub/$slug"
            params={{ slug: agent.slug }}
            className="card-surface flex items-center gap-3 p-4 transition-colors hover:border-primary/40"
          >
            <AgentPortrait src={agent.avatarPath} name={agent.name} size="sm" />
            <div>
              <p className="text-sm font-semibold text-foreground">{agent.name}</p>
              <RarityBadge rarity={agent.rarity} className="mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
