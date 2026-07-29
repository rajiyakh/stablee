import { TrendingTokenPanel } from "@/components/feed/TrendingTokenPanel";
import { CardSkeleton } from "@/components/common/Skeletons";
import { DecorativeCandles } from "../DecorativeCandles";
import { TokenHeatmap } from "../TokenHeatmap";
import { Reveal } from "../Reveal";
import type { TrendingTokenInfo } from "@/lib/feed/types";

export function TerminalPreviewSection({
  trendingTokens,
  isLoading,
}: {
  trendingTokens: TrendingTokenInfo[];
  isLoading: boolean;
}) {
  return (
    <section id="terminal" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Trading Terminal
        </p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          The same terminal, right inside the platform
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          This is a live preview built from the real terminal — not a screenshot.
        </p>
      </Reveal>

      <Reveal delayMs={150} className="mt-12">
        <div className="card-surface overflow-hidden">
          <div className="relative h-32 border-b border-border/70 bg-gradient-to-b from-primary/5 to-transparent p-4">
            <DecorativeCandles className="h-full opacity-40" />
          </div>
          <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Momentum heatmap — 1h change
              </p>
              {isLoading ? <CardSkeleton count={2} /> : <TokenHeatmap tokens={trendingTokens} />}
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Trending table
              </p>
              {isLoading ? (
                <CardSkeleton count={4} />
              ) : (
                <TrendingTokenPanel tokens={trendingTokens} interactive={false} />
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
