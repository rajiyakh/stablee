import { Infinity as InfinityIcon, Lock, TrendingUp } from "lucide-react";
import { Reveal } from "@/features/landing/Reveal";
import { TOTAL_SUPPLY, TOKEN_SYMBOL } from "@/config/tokenomics";
import { SectionShell } from "../shared";

const FACTS = [
  { icon: Lock, label: "Fixed Supply" },
  { icon: TrendingUp, label: "No Inflation" },
  { icon: InfinityIcon, label: "No Future Mint" },
];

export function SupplyNode() {
  return (
    <SectionShell className="flex flex-col items-center py-16 text-center">
      <Reveal>
        <div className="relative">
          <div
            className="animate-orca-glow pointer-events-none absolute inset-0 -z-10 rounded-full opacity-60"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklch, var(--color-primary) 45%, transparent) 0%, transparent 72%)",
              filter: "blur(24px)",
            }}
            aria-hidden="true"
          />
          <div className="glass-panel flex size-64 flex-col items-center justify-center gap-2 rounded-full border-primary/30 px-6 sm:size-72">
            <span className="font-mono text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
              {TOTAL_SUPPLY.toLocaleString("en-US")}
            </span>
            <span className="text-sm font-semibold tracking-wide text-primary">
              ${TOKEN_SYMBOL}
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal delayMs={150}>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {FACTS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="glass-panel flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-muted-foreground"
            >
              <Icon className="size-3.5 text-primary" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </Reveal>

      <Reveal delayMs={250}>
        <p className="mt-6 max-w-md text-sm text-muted-foreground">
          Every allocation below originates from this node.
        </p>
      </Reveal>
    </SectionShell>
  );
}
