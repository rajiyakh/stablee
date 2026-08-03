import {
  ArrowLeftRight,
  Gift,
  KeyRound,
  Landmark,
  Radar,
  Repeat,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/features/landing/Reveal";
import { UTILITY_ITEMS } from "@/config/tokenomics";
import { SectionHeader, SectionShell } from "../shared";

const ICONS: LucideIcon[] = [
  ArrowLeftRight,
  Repeat,
  Sparkles,
  Radar,
  Zap,
  Gift,
  Landmark,
  KeyRound,
];

export function UtilitySection() {
  return (
    <div className="border-y border-border bg-card/30">
      <SectionShell id="utility">
        <SectionHeader eyebrow="Token Utility" title="Holding ORCA unlocks" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {UTILITY_ITEMS.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <Reveal key={item} delayMs={(i % 4) * 80}>
                <div className="glass-panel flex flex-col items-start gap-3 p-5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </SectionShell>
    </div>
  );
}
