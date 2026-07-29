import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AnimatedPulseLogo } from "@/components/branding/AnimatedPulseLogo";
import { Button } from "@/components/ui/button";
import { DecorativeCandles } from "../DecorativeCandles";
import { LandingTicker } from "../LandingTicker";
import type { TrendingTokenInfo } from "@/lib/feed/types";

/** Fixed, deterministic particle positions — no Math.random() (SSR hydration safety). */
const PARTICLES = [
  { top: "18%", left: "8%", size: 6, delay: 0 },
  { top: "32%", left: "22%", size: 4, delay: 0.6 },
  { top: "12%", left: "38%", size: 5, delay: 1.2 },
  { top: "60%", left: "12%", size: 4, delay: 1.8 },
  { top: "70%", left: "28%", size: 6, delay: 0.3 },
  { top: "22%", left: "64%", size: 5, delay: 0.9 },
  { top: "45%", left: "78%", size: 4, delay: 1.5 },
  { top: "68%", left: "88%", size: 6, delay: 2.1 },
  { top: "84%", left: "55%", size: 4, delay: 0.45 },
  { top: "10%", left: "86%", size: 5, delay: 1.05 },
] as const;

export function HeroSection({ tickerTokens }: { tickerTokens: TrendingTokenInfo[] }) {
  return (
    <section id="top" className="relative flex flex-col overflow-hidden">
      <div className="relative flex min-h-[92vh] flex-col items-center justify-center px-4 pb-16 pt-28 text-center sm:px-6 lg:px-8">
        {/* Ambient decoration — purely visual, no data attached */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-x-0 bottom-0 h-64 opacity-[0.07]">
            <DecorativeCandles className="h-full px-8" />
          </div>
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="animate-drift absolute rounded-full bg-primary/40"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
          <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative">
          <AnimatedPulseLogo size={72} className="mx-auto" />
        </div>

        <h1 className="relative mt-8 font-display text-6xl tracking-tight text-foreground sm:text-7xl lg:text-8xl">
          RobinPulse
        </h1>
        <p className="relative mt-4 text-xl font-medium text-primary sm:text-2xl">
          The Intelligence Layer of Robinhood Mainnet
        </p>
        <p className="relative mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          RobinPulse combines AI market intelligence, live analytics, and seamless trading into one
          platform for Robinhood Mainnet.
        </p>

        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/app">
              Open App
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-8">
            <a href="#what-is">Learn More</a>
          </Button>
        </div>
      </div>

      <LandingTicker tokens={tickerTokens} />
    </section>
  );
}
