import { REWARD_ENGINE_FLOW } from "@/config/tokenomics";
import { FlowDiagram } from "../FlowDiagram";
import { Reveal } from "@/features/landing/Reveal";
import { SectionHeader, SectionShell } from "../shared";

export function RewardEngineFlow() {
  return (
    <SectionShell id="reward-engine">
      <SectionHeader
        eyebrow="Distribution Mechanism"
        title="ORCA Reward Engine"
        subtitle="Rewards are distributed exclusively from the Community & Ecosystem allocation — never minted, never inflationary."
      />
      <div className="mt-12">
        <FlowDiagram steps={REWARD_ENGINE_FLOW} />
      </div>
      <Reveal delayMs={200}>
        <p className="mx-auto mt-8 max-w-md text-center text-xs text-muted-foreground">
          Rewards come only from the Community &amp; Ecosystem allocation shown above.
        </p>
      </Reveal>
    </SectionShell>
  );
}
