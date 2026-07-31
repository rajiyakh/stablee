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
        description="The RobinPulse Ocean Intelligence Fleet consists of six autonomous marine AI agents designed to monitor Robinhood Mainnet from the smallest emerging opportunities to the largest whale movements. Each Agent specializes in a different layer of market intelligence and farms $ORCA every day after recruitment."
      />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentRecruitCard key={agent.id} agent={agent} onRecruitClick={onRecruitClick} />
        ))}
      </div>
    </section>
  );
}
