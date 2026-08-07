import { CheckCircle2 } from "lucide-react";
import { Reveal } from "@/features/landing/Reveal";
import { TRUST_BADGES } from "@/config/tokenomics";
import { SectionShell } from "../shared";

export function TrustBanner() {
  return (
    <SectionShell className="max-w-4xl py-14">
      <Reveal>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {TRUST_BADGES.map((badge) => (
            <span
              key={badge}
              className="glass-panel flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-foreground"
            >
              <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
              {badge}
            </span>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  );
}
