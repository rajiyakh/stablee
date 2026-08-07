import { Reveal } from "@/features/landing/Reveal";
import { TOKEN_ALLOCATION } from "@/config/tokenomics";
import { SectionHeader, SectionShell } from "../shared";

export function TokenAllocationSection() {
  return (
    <SectionShell className="max-w-6xl">
      <SectionHeader eyebrow="Distribution" title="Token Allocation" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOKEN_ALLOCATION.map((item, i) => (
          <Reveal key={item.name} delayMs={(i % 4) * 80}>
            <div className="glass-panel group flex h-full flex-col gap-2.5 p-6 transition-colors hover:border-primary/40">
              <p className="font-display text-4xl font-semibold tabular-nums text-primary">
                {item.percent}%
              </p>
              <p className="text-sm font-semibold text-foreground">{item.name}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}
