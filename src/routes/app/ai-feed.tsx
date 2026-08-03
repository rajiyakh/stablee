import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { CardSkeleton } from "@/components/common/Skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BuySwapButton } from "@/components/market/BuySwapButton";
import { AgentMessageCard } from "@/components/feed/AgentMessageCard";
import { AgentConsensusCard } from "@/components/feed/AgentConsensusCard";
import { chainTrendingQuery } from "@/lib/market/client";
import { manualLookupQuery } from "@/lib/feed/client";
import { projectConfig } from "@/config/project";
import { buildAutomatedSummaries } from "@/lib/feed/summaries";
import { relativeTime } from "@/lib/market/format";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export const Route = createFileRoute("/app/ai-feed")({
  head: () => ({
    meta: [
      { title: "AI Feed — Automated market summaries | RobinPulse" },
      {
        name: "description",
        content:
          "Deterministic, data-derived market summaries generated from live Robinhood Mainnet DEX Screener data, plus published agent calls once they exist.",
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
  const chain = useQuery({ ...chainTrendingQuery(chainId), enabled: Boolean(chainId) });

  const generatedAt = chain.data?.fetchedAt ?? new Date().toISOString();
  const summaries = chain.data?.data
    ? buildAutomatedSummaries(chain.data.data.markets, generatedAt)
    : [];

  const [addressInput, setAddressInput] = useState("");
  const [submittedAddress, setSubmittedAddress] = useState<string | null>(null);
  const trimmedInput = addressInput.trim();
  const isValidAddress = EVM_ADDRESS_RE.test(trimmedInput);

  const lookup = useQuery(
    manualLookupQuery(chainId, submittedAddress ?? "", Boolean(submittedAddress && chainId)),
  );

  function handleAnalyze() {
    if (!isValidAddress) return;
    setSubmittedAddress(trimmedInput);
  }

  return (
    <PageContainer>
      <SectionHeading
        eyebrow="Automated"
        title="AI Feed"
        description="Deterministic summaries generated from live provider data, plus agent-published calls once they exist. Nothing here is written by a live model."
      />

      <div className="mt-6 rounded-xl border border-border bg-card backdrop-blur-md p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Analyze any token</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Paste a Robinhood Mainnet token contract address to get the same kind of multi-agent read
          the feed publishes automatically.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAnalyze();
            }}
            placeholder="0x…"
            aria-label="Token contract address"
            className="font-mono text-sm"
          />
          <Button
            type="button"
            onClick={handleAnalyze}
            disabled={!isValidAddress || lookup.isFetching}
            className="shrink-0"
          >
            {lookup.isFetching ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              "Analyze"
            )}
          </Button>
        </div>
        {trimmedInput.length > 0 && !isValidAddress ? (
          <p className="mt-2 text-xs text-negative">
            Enter a valid contract address (0x followed by 40 hex characters).
          </p>
        ) : null}
      </div>

      {submittedAddress ? (
        <section className="mt-6">
          <SectionHeading eyebrow="Agents" title="Agent calls" />
          <div className="mt-4">
            {lookup.isPending ? (
              <CardSkeleton count={2} />
            ) : lookup.isError ? (
              <ErrorState
                message={(lookup.error as Error).message}
                onRetry={() => lookup.refetch()}
              />
            ) : lookup.data?.data ? (
              <div className="space-y-4">
                <AgentConsensusCard consensus={lookup.data.data.consensus} />
                {lookup.data.data.messages.map((message) => (
                  <AgentMessageCard key={message.id} message={message} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Robinhood Mainnet
        </p>
        {!chainId ? (
          <EmptyState
            title="Robinhood Mainnet is not configured yet"
            description="No DEX Screener chain identifier has been supplied for Robinhood Mainnet, so no on-chain markets can be retrieved. Nothing is shown in place of real data."
            className="mt-3"
          />
        ) : chain.isPending ? (
          <CardSkeleton count={4} />
        ) : chain.isError ? (
          <ErrorState message={(chain.error as Error).message} onRetry={() => chain.refetch()} />
        ) : summaries.length === 0 ? (
          <EmptyState
            title="No summaries available"
            description="The provider returned no on-chain markets for Robinhood Mainnet right now."
            className="mt-3"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {summaries.map((summary) => (
              <article
                key={summary.id}
                className="rounded-xl border border-border bg-card backdrop-blur-md p-5"
              >
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
                  {summary.asset.href.to === "/app/token/$chainId/$address" ? (
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
    </PageContainer>
  );
}
