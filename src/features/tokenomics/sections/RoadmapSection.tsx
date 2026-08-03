import { Reveal } from "@/features/landing/Reveal";
import { ROADMAP_PHASES } from "@/config/tokenomics";
import { SectionHeader, SectionShell } from "../shared";

export function RoadmapSection() {
  return (
    <div className="border-y border-border bg-card/30">
      <SectionShell id="roadmap">
        <SectionHeader eyebrow="Protocol Timeline" title="Roadmap" />
        <div className="relative mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="pointer-events-none absolute left-0 right-0 top-[9px] hidden h-px bg-border lg:block"
            aria-hidden="true"
          />
          {ROADMAP_PHASES.map((phase, i) => (
            <Reveal key={phase.phase} delayMs={i * 120}>
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      i === 0
                        ? "relative z-10 size-[18px] rounded-full border-2 border-primary bg-primary"
                        : "relative z-10 size-[18px] rounded-full border-2 border-border bg-background"
                    }
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    {phase.phase}
                  </span>
                </div>
                <div className="glass-panel flex-1 p-5">
                  <h3 className="text-base font-semibold text-foreground">{phase.title}</h3>
                  <ul className="mt-3 space-y-1.5">
                    {phase.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                    {i === 0 ? "Live" : "Upcoming"}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
