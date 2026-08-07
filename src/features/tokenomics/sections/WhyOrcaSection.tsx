import {
  ArrowLeftRight,
  Gift,
  Network,
  Radar,
  Scale,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/features/landing/Reveal";
import { WHY_ORCA_ITEMS } from "@/config/tokenomics";
import { SectionHeader, SectionShell } from "../shared";

const ICONS: LucideIcon[] = [ArrowLeftRight, Network, Sparkles, Radar, Scale, Gift];

export function WhyOrcaSection() {
  return (
    <SectionShell className="max-w-5xl">
      <SectionHeader eyebrow="Utility" title="Why ORCA?" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WHY_ORCA_ITEMS.map((item, i) => {
          const Icon = ICONS[i];
          return (
            <Reveal key={item} delayMs={(i % 3) * 80}>
              <div className="glass-panel flex items-center gap-3 p-5 transition-colors hover:border-primary/40">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-foreground">{item}</span>
              </div>
            </Reveal>
          );
        })}
      </div>
    </SectionShell>
  );
}
