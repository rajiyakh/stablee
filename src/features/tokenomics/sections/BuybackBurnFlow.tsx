import { BUYBACK_BURN_FLOW } from "@/config/tokenomics";
import { FlowDiagram } from "../FlowDiagram";
import { SectionHeader, SectionShell } from "../shared";

export function BuybackBurnFlow() {
  return (
    <SectionShell id="buyback-burn">
      <SectionHeader
        eyebrow="Supply Mechanics"
        title="Buyback & Burn"
        subtitle="Protocol revenue periodically funds a treasury buyback, permanently removing ORCA from circulation."
      />
      <div className="mt-12">
        <FlowDiagram steps={BUYBACK_BURN_FLOW} variant="circular" />
      </div>
    </SectionShell>
  );
}
