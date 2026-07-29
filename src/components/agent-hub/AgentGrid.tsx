import { SectionHeading } from "@/components/common/SectionHeading";
import { AgentRecruitCard } from "./AgentRecruitCard";
import type { GenesisAgentConfig } from "@/config/genesisAgents";

export function AgentGrid({
  agents,
  onRecruitClick,
}: {
  agents: GenesisAgentConfig[];
  onRecruitClick: (agent: GenesisAgentConfig) => void;
}) {
  return (
    <section id="agents">
      <SectionHeading
        eyebrow="Genesis Collection"
        title="Six Genesis Agents"
        description="Each Agent has a fixed maximum supply, a wallet limit, and a configured hourly $PULSE farming rate."
      />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentRecruitCard key={agent.id} agent={agent} onRecruitClick={onRecruitClick} />
        ))}
      </div>
    </section>
  );
}
