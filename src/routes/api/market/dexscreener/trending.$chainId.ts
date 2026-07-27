import { createFileRoute } from "@tanstack/react-router";
import { getRobinhoodMainnetMarkets } from "@/providers/robinhood.server";
import {
  chainSchema,
  envelope,
  guard,
  invalidParams,
  jsonError,
  jsonOk,
} from "@/lib/market/api.server";

/**
 * Robinhood-specific (or any chain-specific) trending discovery.
 *
 * Candidates come ONLY from records that carry the requested chain ID, or from
 * the owner-supplied verified-token registry. Nothing from another chain can
 * leak into the result.
 */
export const Route = createFileRoute("/api/market/dexscreener/trending/$chainId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const limited = guard(request, "ds-trending");
        if (limited) return limited;
        const chain = chainSchema.safeParse(params.chainId);
        if (!chain.success) return invalidParams("dexscreener");

        try {
          const result = await getRobinhoodMainnetMarkets(chain.data);
          return jsonOk(
            envelope("dexscreener", {
              data: { markets: result.markets, boosted: result.boosted },
              fetchedAt: result.fetchedAt,
              cached: result.cached,
              stale: result.stale,
            }),
            60,
          );
        } catch (error) {
          return jsonError("dexscreener", error);
        }
      },
    },
  },
});
