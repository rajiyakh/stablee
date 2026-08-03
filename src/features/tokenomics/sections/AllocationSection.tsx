import { ChevronDown } from "lucide-react";
import { Reveal } from "@/features/landing/Reveal";
import { ALLOCATION } from "@/config/tokenomics";
import { SectionHeader, SectionShell } from "../shared";

export function AllocationSection() {
  return (
    <SectionShell id="allocation">
      <div className="flex flex-col items-center" aria-hidden="true">
        <svg width="2" height="40" className="text-border">
          <line x1="1" y1="0" x2="1" y2="40" stroke="currentColor" strokeWidth="1" />
        </svg>
        <ChevronDown className="-mt-1 size-3 text-primary" />
      </div>

      <SectionHeader
        eyebrow="Fixed Distribution"
        title="Token Allocation"
        subtitle="1,000,000,000 ORCA distributed across six categories — every category originates from the fixed-supply node above."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALLOCATION.map((category, i) => (
          <Reveal key={category.label} delayMs={(i % 3) * 100}>
            <div className="glass-panel flex h-full flex-col gap-4 p-6">
              <div>
                <span className="font-mono text-4xl font-semibold tabular-nums text-primary">
                  {category.percent}%
                </span>
                <h3 className="mt-1 text-base font-semibold text-foreground">{category.label}</h3>
              </div>
              <ul className="space-y-1.5 border-t border-border pt-3">
                {category.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}
