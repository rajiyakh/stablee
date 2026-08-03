import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PulseLoadingState } from "@/components/branding/PulseLoadingState";
import { isWalletConfigured, WALLET_NOT_CONFIGURED_MESSAGE } from "@/config/project";

/**
 * Lazy, not a static import — same reasoning as swap.index.tsx: PortfolioPage
 * pulls in usePrivy/useAccount (the Privy SDK), which a static import here
 * would ship to every visitor regardless of whether they ever open /portfolio.
 */
const PortfolioPage = lazy(() =>
  import("@/features/portfolio/PortfolioPage").then((m) => ({ default: m.PortfolioPage })),
);

export const Route = createFileRoute("/app/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Robinhood Chain | RobinPulse" },
      {
        name: "description",
        content: "Every token your connected wallet holds on Robinhood Mainnet, with live pricing.",
      },
    ],
  }),
  component: PortfolioRoute,
});

function PortfolioRoute() {
  if (!isWalletConfigured()) {
    return (
      <PageContainer>
        <SectionHeading
          eyebrow="Holdings · Robinhood Mainnet"
          title="Portfolio"
          description={`Portfolio is not yet available. ${WALLET_NOT_CONFIGURED_MESSAGE}`}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeading
        eyebrow="Holdings · Robinhood Mainnet"
        title="Portfolio"
        description="Every token your connected wallet holds on Robinhood Mainnet, priced live."
        backgroundImage="/backgrounds/portfolio-hero.webp"
      />
      <div className="mt-6">
        <Suspense fallback={<PulseLoadingState />}>
          <PortfolioPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
