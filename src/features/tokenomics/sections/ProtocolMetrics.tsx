import {
  Activity,
  ArrowLeftRight,
  Bell,
  Flame,
  Landmark,
  Sparkles,
  TrendingUp,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/features/landing/Reveal";
import { PROTOCOL_METRICS } from "@/config/tokenomics";
import { SectionHeader, SectionShell } from "../shared";

const ICONS: LucideIcon[] = [
  ArrowLeftRight,
  Waves,
  TrendingUp,
  Activity,
  Sparkles,
  Bell,
  Flame,
  Landmark,
];

/** No metric has real data yet — $ORCA hasn't launched (src/config/token.ts).
 *  Every card shows an honest "not live yet" state, never a fabricated
 *  number, matching this codebase's established anti-fabrication discipline. */
export function ProtocolMetrics() {
  return (
    <SectionShell id="metrics">
      <SectionHeader
        eyebrow="Live Dashboard"
        title="Protocol Metrics"
        subtitle="Real-time protocol activity, tracked from launch."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PROTOCOL_METRICS.map((label, i) => {
          const Icon = ICONS[i];
          return (
            <Reveal key={label} delayMs={(i % 4) * 80}>
              <div className="glass-panel flex flex-col gap-4 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </span>
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <span className="font-mono text-2xl font-semibold text-muted-foreground/50">
                    &mdash;
                  </span>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                    Live at launch
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </SectionShell>
  );
}
