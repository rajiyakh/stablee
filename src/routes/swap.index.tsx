import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { isWalletConfigured } from "@/config/project";
import { SwapPage } from "@/features/swap/SwapPage";

export const Route = createFileRoute("/swap/")({
  head: () => ({
    meta: [
      { title: "Swap — Robinhood Chain | RobinPulse AI" },
      {
        name: "description",
        content:
          "Swap Robinhood Mainnet tokens via the 0x Swap API, with a transparent RobinPulse platform fee.",
      },
    ],
  }),
  component: SwapRoute,
});

function SwapRoute() {
  if (!isWalletConfigured()) {
    return (
      <PageContainer>
        <SectionHeading
          eyebrow="0x Swap API · Robinhood Mainnet"
          title="Swap"
          description="Swap is not yet available. Wallet integration is not yet configured for this deployment."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeading
        eyebrow="0x Swap API · Robinhood Mainnet"
        title="Swap"
        description="Swap Robinhood Mainnet tokens through 0x's audited swap infrastructure. RobinPulse charges a transparent 0.10% platform fee on completed swaps."
      />
      <div className="mt-6">
        <SwapPage />
      </div>
    </PageContainer>
  );
}
