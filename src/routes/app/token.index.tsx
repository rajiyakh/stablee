import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  Sparkles,
  Landmark,
  Gem,
  Gift,
  KeyRound,
  Coins,
  Users,
  ShieldAlert,
  Waves,
} from "lucide-react";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { OrcaTokenHero } from "@/components/token/OrcaTokenHero";
import { TokenUtilityGrid, type TokenUtilityItem } from "@/components/token/TokenUtilityGrid";
import { OceanIntelligenceFleet } from "@/components/token/OceanIntelligenceFleet";
import { tokenConfig } from "@/config/token";

export const Route = createFileRoute("/app/token/")({
  head: () => ({
    meta: [
      { title: "$ORCA — RobinPulse Token | RobinPulse" },
      {
        name: "description",
        content: tokenConfig.description,
      },
      { property: "og:title", content: tokenConfig.headline },
      { property: "og:description", content: tokenConfig.description },
    ],
  }),
  component: TokenPage,
});

const WHAT_IS_ITEMS: TokenUtilityItem[] = [
  { icon: Bot, label: "Genesis Agent Farming" },
  { icon: Sparkles, label: "AI Intelligence" },
  { icon: Landmark, label: "Future Governance" },
  { icon: Gem, label: "Premium Features" },
  { icon: Gift, label: "Community Rewards" },
];

const UTILITY_ITEMS: TokenUtilityItem[] = [
  { icon: Bot, label: "Genesis Agent Farming" },
  { icon: KeyRound, label: "Premium AI Access" },
  { icon: Coins, label: "Reward Distribution" },
  { icon: Landmark, label: "Future Governance" },
  { icon: Users, label: "Community Incentives" },
];

function TokenPage() {
  const infoRows = [
    { label: "Ticker", value: `$${tokenConfig.tokenSymbol}` },
    { label: "Network", value: tokenConfig.chainId },
    { label: "Status", value: "Coming Soon" },
    { label: "Contract", value: tokenConfig.contractAddress || "TBA" },
  ];

  return (
    <PageContainer>
      <OrcaTokenHero />

      <TokenUtilityGrid
        id="what-is-orca"
        eyebrow="What is $ORCA"
        title="$ORCA powers every product inside RobinPulse."
        items={WHAT_IS_ITEMS}
      />

      <section className="mx-auto mt-16 max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <Waves className="mr-1.5 inline size-3.5" aria-hidden="true" />
          Why Orca
        </p>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
          The Orca symbolizes intelligence, precision, coordination and leadership. It represents
          RobinPulse's mission to analyze markets, discover opportunities and deliver public market
          intelligence.
        </p>
      </section>

      <TokenUtilityGrid id="utility" eyebrow="Utility" title="Utility" items={UTILITY_ITEMS} />

      <OceanIntelligenceFleet />

      <section id="token-information" className="mt-16">
        <SectionHeading eyebrow="Token Information" title="Token Information" />
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
          {infoRows.map((row) => (
            <div key={row.label} className="bg-card p-5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-16 mb-4 max-w-3xl rounded-xl border border-warning/40 bg-warning/10 p-6">
        <div className="flex items-center gap-2 text-warning">
          <ShieldAlert className="size-5" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Safety notice</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          No official $ORCA contract has been deployed yet. Always verify contract addresses through
          official RobinPulse channels only.
        </p>
      </section>
    </PageContainer>
  );
}
