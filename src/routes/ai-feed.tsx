import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { CardSkeleton } from "@/components/common/Skeletons";
import { Badge } from "@/components/ui/badge";
import { BuySwapButton } from "@/components/market/BuySwapButton";
import { chainTrendingQuery, globalTrendingQuery } from "@/lib/market/client";
import { projectConfig } from "@/config/project";
import { buildAutomatedSummaries } from "@/lib/feed/summaries";
import { relativeTime } from "@/lib/market/format";

export const Route = createFileRoute("/ai-feed")({
  head: () => ({
    meta: [
      { title: "AI Feed — Automated market summaries | RobinPulse AI" },
      {
        name: "description",
        content:
          "Deterministic, data-derived market summaries generated from live CoinGecko and DEX Screener data, plus published agent calls once they exist.",
      },
      { property: "og:title", content: "AI Feed" },
      {
        property: "og:description",
        content: "Automated market summaries derived from real, live data.",
      },
    ],
  }),
  component: AiFeedPage,
});

function AiFeedPage() {
  const chainId = projectConfig.dataSources.robinhoodDexScreenerChainId;
  const trending = useQuery(globalTrendingQuery());
  const chain = useQuery({ ...chainTrendingQuery(chainId), enabled: Boolean(chainId) });

  const generatedAt = trending.data?.fetchedAt ?? new Date().toISOString();
  const summaries = trending.data?.data
    ? buildAutomatedSummaries(trending.data.data, chain.data?.data?.markets ?? [], generatedAt)
    : [];

  return (
    <PageContainer>
      <SectionHeading
        eyebrow="Automated"
        title="AI Feed"
        description="Deterministic summaries generated from live provider data, plus agent-published calls once they exist. Nothing here is written by a live model."
      />

      <div className="mt-6">
        {trending.isPending ? (
          <CardSkeleton count={4} />
        ) : trending.isError ? (
          <ErrorState
            message={(trending.error as Error).message}
            onRetry={() => trending.refetch()}
          />
        ) : summaries.length === 0 ? (
          <EmptyState
            title="No summaries available"
            description="Providers returned no data to summarize right now."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {summaries.map((summary) => (
              <article key={summary.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    Automated Market Summary
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(summary.dataTimestamp)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Link
                    to={summary.asset.href.to}
                    params={summary.asset.href.params}
                    className="block text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {summary.asset.name} ({summary.asset.symbol})
                  </Link>
                  {summary.asset.href.to === "/token/$chainId/$address" ? (
                    <BuySwapButton
                      chainId={summary.asset.href.params.chainId}
                      address={summary.asset.href.params.address}
                    />
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {summary.headline}
                </p>
                <dl className="mt-4 grid grid-cols-3 gap-2">
                  {summary.metrics.map((metric) => (
                    <div key={metric.label}>
                      <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {metric.label}
                      </dt>
                      <dd className="mt-0.5 text-xs font-semibold tabular-nums text-foreground">
                        {metric.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-xs text-muted-foreground">
                  {summary.dataProvider} · {summary.category} · {summary.disclaimer}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      <section className="mt-12">
        <SectionHeading eyebrow="Agents" title="Agent calls" />
        <div className="mt-4">
          <EmptyState
            title="No agent calls have been published yet"
            description="Once an agent publishes a scored, timestamped call, it will appear here alongside its full evidence and outcome."
          />
        </div>
      </section>
    </PageContainer>
  );
}
