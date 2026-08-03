import {
  Cpu,
  Droplets,
  Megaphone,
  Rocket,
  Server,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/features/landing/Reveal";
import { TREASURY_CATEGORIES } from "@/config/tokenomics";
import { SectionHeader, SectionShell } from "../shared";

const ICONS: LucideIcon[] = [Cpu, Server, Droplets, ShieldCheck, Megaphone, Users, Rocket];

export function TreasurySection() {
  return (
    <SectionShell id="treasury">
      <SectionHeader
        eyebrow="Protocol Reserves"
        title="Treasury"
        subtitle="Treasury funds the operations that keep RobinPulse running and growing."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TREASURY_CATEGORIES.map((category, i) => {
          const Icon = ICONS[i];
          return (
            <Reveal key={category} delayMs={(i % 4) * 80}>
              <div className="glass-panel flex flex-col items-start gap-3 p-5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-foreground">{category}</span>
              </div>
            </Reveal>
          );
        })}
      </div>
    </SectionShell>
  );
}
