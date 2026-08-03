import { ECONOMY_LOOP_FLOW } from "@/config/tokenomics";
import { FlowDiagram } from "../FlowDiagram";
import { SectionHeader, SectionShell } from "../shared";

export function EconomyLoopFlow() {
  return (
    <div className="border-y border-border bg-card/30">
      <SectionShell id="economy-loop">
        <SectionHeader
          eyebrow="The Full Cycle"
          title="Economy Loop"
          subtitle="Usage funds development, development improves the product, and a better product brings more usage."
        />
        <div className="mt-12">
          <FlowDiagram steps={ECONOMY_LOOP_FLOW} />
        </div>
      </SectionShell>
    </div>
  );
}
