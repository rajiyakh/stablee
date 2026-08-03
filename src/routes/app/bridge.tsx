import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PulseLoadingState } from "@/components/branding/PulseLoadingState";
import { isWalletConfigured, WALLET_NOT_CONFIGURED_MESSAGE } from "@/config/project";

/**
 * Lazy, not a static import — same reasoning as swap.index.tsx/portfolio.tsx:
 * BridgePage pulls in the Privy SDK (usePrivy), which a static import here
 * would ship to every visitor regardless of whether they ever open /bridge.
 */
const BridgePage = lazy(() =>
  import("@/features/bridge/BridgePage").then((m) => ({ default: m.BridgePage })),
);

export const Route = createFileRoute("/app/bridge")({
  head: () => ({
    meta: [
      { title: "Bridge — Robinhood Chain | RobinPulse" },
      {
        name: "description",
        content:
          "Bridge tokens into Robinhood Mainnet from Ethereum, Arbitrum, Base, Optimism, Polygon, and BSC.",
      },
    ],
  }),
  component: BridgeRoute,
});

function BridgeRoute() {
  if (!isWalletConfigured()) {
    return (
      <PageContainer>
        <SectionHeading
          eyebrow="Cross-Chain · Robinhood Mainnet"
          title="Bridge"
          description={`Bridge is not yet available. ${WALLET_NOT_CONFIGURED_MESSAGE}`}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeading
        eyebrow="Cross-Chain · Robinhood Mainnet"
        title="Bridge"
        description="Move tokens into Robinhood Mainnet from Ethereum, Arbitrum, Base, Optimism, Polygon, and BSC — routed through LI.FI, Relay, and Across."
      />
      <div className="mt-6">
        <Suspense fallback={<PulseLoadingState />}>
          <BridgePage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
