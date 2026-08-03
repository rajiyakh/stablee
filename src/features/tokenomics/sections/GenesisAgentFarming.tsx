import { ArrowLeftRight, Droplets, Network, ScanSearch, Target, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/features/landing/Reveal";
import { GENESIS_AGENTS, FARMING_FLOW } from "@/config/tokenomics";
import { FlowDiagram } from "../FlowDiagram";
import { SectionHeader, SectionShell } from "../shared";

const AGENT_ICONS: LucideIcon[] = [ScanSearch, Waves, Droplets, Target, ArrowLeftRight, Network];

export function GenesisAgentFarming() {
  return (
    <div className="border-y border-border bg-card/30">
      <SectionShell>
        <SectionHeader
          eyebrow="Pre-Launch Program"
          title="Genesis AI Agent Farming"
          subtitle="Earn ORCA by contributing to the RobinPulse Intelligence Network."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GENESIS_AGENTS.map((agent, i) => {
            const Icon = AGENT_ICONS[i];
            return (
              <Reveal key={agent.name} delayMs={(i % 3) * 100}>
                <div className="glass-panel group relative h-full overflow-hidden p-6 transition-colors hover:border-primary/40">
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(circle, color-mix(in oklch, var(--color-primary) 40%, transparent) 0%, transparent 70%)",
                      filter: "blur(20px)",
                    }}
                    aria-hidden="true"
                  />
                  <div className="relative flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {agent.order}
                    </span>
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="relative mt-3 font-display text-2xl text-foreground">
                    {agent.name}
                  </h3>
                  <ul className="relative mt-4 space-y-1.5">
                    {agent.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delayMs={200}>
          <p className="mx-auto mt-16 max-w-md text-center text-sm text-muted-foreground">
            All six agents connect into the
          </p>
        </Reveal>

        <div className="mt-8">
          <FlowDiagram steps={FARMING_FLOW} />
        </div>

        <Reveal delayMs={300}>
          <div className="mt-12 flex justify-center">
            <span className="animate-orca-glow glass-panel inline-flex items-center gap-2 rounded-full border-primary/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Coming Soon
            </span>
          </div>
        </Reveal>
      </SectionShell>
    </div>
  );
}
