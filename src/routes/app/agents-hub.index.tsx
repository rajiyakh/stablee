import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAccount } from "wagmi";
import { Plus } from "lucide-react";
import { PageContainer } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { robinhoodChain } from "@/config/robinhoodChain";
import { enabledGenesisAgents, type GenesisAgentConfig } from "@/config/genesisAgents";
import { AgentHubHero } from "@/components/agent-hub/AgentHubHero";
import { AgentGrid } from "@/components/agent-hub/AgentGrid";
import { AgentComparisonTable } from "@/components/agent-hub/AgentComparisonTable";
import { HowFarmingWorks } from "@/components/agent-hub/HowFarmingWorks";
import { MyAgentsDashboard } from "@/components/agent-hub/MyAgentsDashboard";
import { TgeStatusPanel } from "@/components/agent-hub/TgeStatusPanel";
import { PreTgeNotice } from "@/components/agent-hub/PreTgeNotice";
import { AgentHubFaq } from "@/components/agent-hub/AgentHubFaq";
import { RecruitmentConfirmationModal } from "@/components/agent-hub/RecruitmentConfirmationModal";
import { useAgentHubPreview } from "@/hooks/useAgentHubPreview";

export const Route = createFileRoute("/app/agents-hub/")({
  head: () => ({
    meta: [
      { title: "Agent Hub — pre-TGE AI Agent farming | RobinPulse" },
      {
        name: "description",
        content:
          "Recruit Genesis Agents and farm future $PULSE allocation before TGE. Recruitment is not currently live — no wallet-gated purchases exist yet.",
      },
    ],
  }),
  component: AgentsHubPage,
});

function AgentsHubPage() {
  const { isConnected, chainId } = useAccount();
  const wrongNetwork = Boolean(isConnected && robinhoodChain && chainId !== robinhoodChain.id);

  // Real wallet ownership (unconfiguredOwnershipAdapter) always resolves to
  // an empty array pre-integration — see docs/AGENT_CONTRACT_INTEGRATION.md.
  // Only local preview positions can currently be non-empty.
  const preview = useAgentHubPreview();
  const [recruitTarget, setRecruitTarget] = useState<GenesisAgentConfig | null>(null);

  const agents = enabledGenesisAgents();

  return (
    <PageContainer>
      <div className="space-y-16">
        <AgentHubHero />

        <AgentGrid agents={agents} onRecruitClick={setRecruitTarget} />

        <p className="mx-auto -mt-10 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
          Agent Hub is in a pre-TGE preview — recruitment isn't live yet, so no wallet connection,
          payment, or on-chain transaction happens anywhere on this page today.
        </p>

        <AgentComparisonTable agents={agents} />

        <div id="how-farming-works">
          <HowFarmingWorks />
        </div>

        <div>
          {preview.enabled ? (
            <div className="mb-3 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => preview.add(agents[0]?.id ?? "vector")}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Add Preview Agent
              </Button>
            </div>
          ) : null}
          <MyAgentsDashboard
            positions={preview.positions}
            isPreviewData={preview.enabled}
            isWalletConnected={isConnected}
            isWrongNetwork={wrongNetwork}
          />
        </div>

        <TgeStatusPanel />

        <PreTgeNotice />

        <AgentHubFaq />

        <section className="rounded-2xl border border-border bg-card p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
            Ready to build your research team?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Explore the six Genesis Agents and prepare for recruitment.
          </p>
          <Button asChild size="lg" className="mt-5 rounded-full">
            <a href="#agents">Explore Agents</a>
          </Button>
        </section>
      </div>

      <RecruitmentConfirmationModal
        agent={recruitTarget}
        open={recruitTarget !== null}
        onOpenChange={(open) => !open && setRecruitTarget(null)}
      />
    </PageContainer>
  );
}
