import { createFileRoute, redirect } from "@tanstack/react-router";
import { projectConfig } from "@/config/project";

/**
 * The on-chain token detail page already lives at /token/$chainId/$address
 * (chart, risk flags, stat cards, all-pairs, watchlist) — this is a thin
 * redirect rather than a second detail page for the same token.
 */
export const Route = createFileRoute("/app/markets/robinhood/$tokenAddress")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/app/token/$chainId/$address",
      params: {
        chainId: projectConfig.dataSources.robinhoodDexScreenerChainId || "robinhood",
        address: params.tokenAddress,
      },
    });
  },
});
