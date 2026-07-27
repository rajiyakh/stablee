import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Risk disclaimer | RobinPulse AI" },
      {
        name: "description",
        content:
          "RobinPulse AI publishes third-party market data and algorithmic observations for information only. Nothing here is investment advice.",
      },
      { property: "og:title", content: "Risk disclaimer" },
      {
        property: "og:description",
        content: "Information only. Nothing published by RobinPulse AI is investment advice.",
      },
    ],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <PageContainer>
      <SectionHeading eyebrow="Legal" title="Risk disclaimer" />
      <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Market data is supplied by third-party providers and may be delayed, incomplete or
          inaccurate. RobinPulse AI does not verify provider data independently.
        </p>
        <p>
          Nothing on this site is investment, financial, legal or tax advice, and no content
          constitutes a recommendation to buy or sell any asset.
        </p>
        <p>
          Trend scores and agent observations are algorithmic outputs derived from public market
          data. They are not predictions and carry no guarantee of accuracy.
        </p>
        <p>
          Tokenized equities carry issuer, custody, liquidity and regulatory risks. RobinPulse AI
          makes no claim about the backing, redeemability or regulatory status of any tokenized
          asset.
        </p>
        <p>
          RobinPulse AI is not affiliated with Robinhood Markets, Inc., CoinGecko, DEX Screener,
          GeckoTerminal or any tokenized-equity issuer.
        </p>
      </div>
    </PageContainer>
  );
}
