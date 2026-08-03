import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PulseLoadingState } from "@/components/branding/PulseLoadingState";
import { isWalletConfigured, WALLET_NOT_CONFIGURED_MESSAGE } from "@/config/project";

/**
 * Lazy, not a static import: swap.index.tsx is statically imported by the
 * router-generated routeTree.gen.ts, which loads on every route. TradePanel
 * (via SwapPage/BridgePage) pulls in the Privy SDK (usePrivy) — a static
 * import here would ship that to every visitor regardless of whether they
 * ever open /swap. TradePanel statically imports both SwapPage and
 * BridgePage itself, so both stay behind this one lazy() boundary.
 */
const TradePanel = lazy(() =>
  import("@/features/trade/TradePanel").then((m) => ({ default: m.TradePanel })),
);

const evmAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .optional()
  .catch(undefined);

/** ?buy=/?sell= let any page deep-link a specific token into the swap form (see BuySwapButton). ?tab= persists the active Swap/Bridge tab in the URL. */
const searchSchema = z.object({
  buy: evmAddress,
  sell: evmAddress,
  tab: z.enum(["swap", "bridge"]).catch("swap"),
});

export const Route = createFileRoute("/app/swap/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Swap — Robinhood Chain | RobinPulse" },
      {
        name: "description",
        content:
          "Trade Robinhood Mainnet tokens instantly, routed through audited on-chain infrastructure.",
      },
    ],
  }),
  component: SwapRoute,
});

function SwapRoute() {
  const { buy, sell, tab } = Route.useSearch();

  if (!isWalletConfigured()) {
    return (
      <PageContainer>
        <SectionHeading
          eyebrow="Instant Swap · Robinhood Mainnet"
          title="Swap"
          description={`Swap is not yet available. ${WALLET_NOT_CONFIGURED_MESSAGE}`}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeading
        eyebrow="Instant Swap · Robinhood Mainnet"
        title="Swap"
        description="Trade Robinhood Mainnet tokens in seconds — real-time pricing and best-available routing across on-chain liquidity."
      />
      <div className="mt-6">
        <Suspense fallback={<PulseLoadingState />}>
          <TradePanel initialTab={tab} initialBuyAddress={buy} initialSellAddress={sell} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
