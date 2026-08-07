import { ArrowLeftRight, Flame, Landmark, Network, Repeat, type LucideIcon } from "lucide-react";
import { Reveal } from "@/features/landing/Reveal";
import { BUYBACK_FLOW_INPUTS, BUYBACK_FLOW_STAGES } from "@/config/tokenomics";
import { SectionHeader, SectionShell } from "../shared";
import { VerticalConnector } from "../FlowDiagram";

const INPUT_ICONS: LucideIcon[] = [ArrowLeftRight, Network];
const STAGE_ICONS: LucideIcon[] = [Landmark, Repeat, Flame];

function FlowPill({
  icon: Icon,
  label,
  glow,
}: {
  icon: LucideIcon;
  label: string;
  glow?: boolean;
}) {
  return (
    <div className="relative">
      {glow ? (
        <div
          className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--color-primary) 45%, transparent) 0%, transparent 70%)",
            filter: "blur(16px)",
          }}
          aria-hidden="true"
        />
      ) : null}
      <div className="glass-panel flex items-center gap-2.5 px-5 py-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
    </div>
  );
}

/** Static two-stem-into-one-bar connector for the two fee inputs merging
 *  into a single flow — plain CSS lines rather than SVG, since both stems
 *  are short and perfectly vertical (no trig needed). The main Treasury ->
 *  Buyback -> Burn chain below still gets the full animated line + packet
 *  treatment via the reused VerticalConnector. */
function MergeConnector() {
  return (
    <div className="relative h-8 w-28 sm:w-36" aria-hidden="true">
      <span className="absolute left-0 top-0 h-4 w-px bg-border" />
      <span className="absolute right-0 top-0 h-4 w-px bg-border" />
      <span className="absolute left-0 top-4 h-px w-full bg-border" />
      <span className="absolute left-1/2 top-4 h-4 w-px -translate-x-1/2 bg-primary" />
    </div>
  );
}

export function BuybackFlowPremium() {
  return (
    <SectionShell className="max-w-3xl">
      <SectionHeader eyebrow="Deflationary Loop" title="Buyback & Burn" />
      <Reveal delayMs={150}>
        <div className="mt-12 flex flex-col items-center">
          <div className="flex items-start gap-8 sm:gap-14">
            {BUYBACK_FLOW_INPUTS.map((label, i) => (
              <FlowPill key={label} icon={INPUT_ICONS[i]} label={label} />
            ))}
          </div>
          <MergeConnector />
          {BUYBACK_FLOW_STAGES.map((label, i) => (
            <div key={label} className="flex flex-col items-center">
              <FlowPill icon={STAGE_ICONS[i]} label={label} glow={label === "Burn"} />
              {i < BUYBACK_FLOW_STAGES.length - 1 ? <VerticalConnector height={48} /> : null}
            </div>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  );
}
