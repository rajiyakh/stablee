import { Bot, Radar, ShieldAlert, Waves, Eye, ArrowLeftRight } from "lucide-react";
import { TrendingTokenPanel } from "@/components/feed/TrendingTokenPanel";
import { CardSkeleton } from "@/components/common/Skeletons";
import { Reveal } from "../Reveal";
import type { TrendingTokenInfo } from "@/lib/feed/types";

const capabilities = [
  {
    icon: Bot,
    label: "AI Agents",
    copy: "Eight specialist analysts, each with a published methodology.",
  },
  {
    icon: Radar,
    label: "Market intelligence & trend scoring",
    copy: "Trend scoring built from real volume, liquidity and momentum.",
  },
  {
    icon: Waves,
    label: "Trending tokens & hot searches",
    copy: "See where attention and activity are concentrating in real time.",
  },
  {
    icon: ShieldAlert,
    label: "Risk detection",
    copy: "Every market is checked against configurable safeguard thresholds.",
  },
  {
    icon: Eye,
    label: "Liquidity & whale monitoring",
    copy: "Depth quality and one-sided flow, surfaced before you trade.",
  },
  {
    icon: ArrowLeftRight,
    label: "Native swaps",
    copy: "Trade directly on Robinhood Mainnet — no separate DEX required.",
  },
];

export function WhatIsSection({
  trendingTokens,
  isLoading,
}: {
  trendingTokens: TrendingTokenInfo[];
  isLoading: boolean;
}) {
  return (
    <section id="what-is" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            What is RobinPulse
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            One platform for Robinhood Mainnet intelligence
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            RobinPulse reads live, provider-backed market data and turns it into structured,
            explainable analysis — never simulated, never guessed. Every observation traces back to
            a real threshold crossed on real data.
          </p>

          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {capabilities.map((item) => (
              <div key={item.label} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <dt className="text-sm font-semibold text-foreground">{item.label}</dt>
                  <dd className="mt-0.5 text-sm text-muted-foreground">{item.copy}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delayMs={150}>
          <div className="card-surface p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Top Trending Tokens — live
            </p>
            {isLoading ? (
              <CardSkeleton count={4} />
            ) : (
              <TrendingTokenPanel tokens={trendingTokens} interactive={false} />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
