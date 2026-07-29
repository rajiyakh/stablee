import {
  Activity,
  Bot,
  LineChart,
  ShieldAlert,
  Bell,
  Link2,
  ArrowLeftRight,
  Star,
  Users,
  Waves,
} from "lucide-react";
import { Reveal } from "../Reveal";

const features = [
  {
    icon: Activity,
    title: "Real Market Data",
    copy: "Live prices, volume and liquidity sourced directly from CoinGecko and DEX Screener — nothing estimated.",
  },
  {
    icon: Bot,
    title: "AI Intelligence",
    copy: "Eight specialist agents publish structured observations whenever a real threshold is crossed.",
  },
  {
    icon: LineChart,
    title: "Trading Terminal",
    copy: "Trending tables, hot searches and token detail — the same terminal you'll trade from.",
  },
  {
    icon: ShieldAlert,
    title: "Risk Engine",
    copy: "Every market is checked against configurable liquidity, age and volatility safeguards.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    copy: "The risk and trend engine that powers the feed is built to drive proactive notifications as the platform grows.",
  },
  {
    icon: Link2,
    title: "Robinhood Mainnet",
    copy: "Purpose-built for Robinhood's chain — not a generic multi-chain dashboard retrofitted after the fact.",
  },
  {
    icon: ArrowLeftRight,
    title: "Native Swap",
    copy: "Trade directly on-chain with transparent routing and a clearly disclosed platform fee.",
  },
  {
    icon: Star,
    title: "Watchlists",
    copy: "Save any coin or on-chain market and track it alongside live pricing.",
  },
  {
    icon: Users,
    title: "AI Consensus",
    copy: "See where the agent roster agrees — and where risk overrides an otherwise bullish read.",
  },
  {
    icon: Waves,
    title: "Whale Tracking",
    copy: "FlowState and Atlas analyze trade-size and flow imbalance to surface large-participant activity as it emerges.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="border-y border-border/70 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Platform</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Everything the platform runs on
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delayMs={(i % 3) * 100}>
              <div className="group card-surface h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
