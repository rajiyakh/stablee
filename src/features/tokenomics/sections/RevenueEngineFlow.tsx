import { REVENUE_ENGINE_FLOW } from "@/config/tokenomics";
import { FlowDiagram } from "../FlowDiagram";
import { Reveal } from "@/features/landing/Reveal";
import { SectionHeader, SectionShell } from "../shared";

export function RevenueEngineFlow() {
  return (
    <div className="border-y border-border bg-card/30">
      <SectionShell id="revenue-engine">
        <SectionHeader
          eyebrow="Value Capture"
          title="Protocol Revenue Engine"
          subtitle="Every product surface routes value back into the treasury."
        />
        <div className="mt-12">
          <FlowDiagram steps={REVENUE_ENGINE_FLOW} />
        </div>
        <Reveal delayMs={200}>
          <p className="mx-auto mt-8 max-w-md text-center text-xs text-muted-foreground">
            Every protocol fee contributes to long-term ecosystem growth.
          </p>
        </Reveal>
      </SectionShell>
    </div>
  );
}
