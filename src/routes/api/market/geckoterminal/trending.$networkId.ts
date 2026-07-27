import { createFileRoute } from "@tanstack/react-router";
import { geckoTerminalConfigured, getTrendingPools } from "@/lib/market/geckoterminal.server";
import { rankMarkets } from "@/lib/market/trending";
import {
  chainSchema,
  envelope,
  guard,
  jsonError,
  jsonOk,
  notConfigured,
} from "@/lib/market/api.server";

export const Route = createFileRoute("/api/market/geckoterminal/trending/$networkId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const limited = guard(request, "gt-trending");
        if (limited) return limited;
        if (!geckoTerminalConfigured()) {
          return notConfigured(
            "geckoterminal",
            "GeckoTerminal is not activated because no network identifier is configured.",
          );
        }
        const network = chainSchema.safeParse(params.networkId);
        if (!network.success) return jsonError("geckoterminal", new Error("invalid network"));
        try {
          const res = await getTrendingPools(network.data);
          return jsonOk(
            envelope("geckoterminal", {
              ...res,
              data: rankMarkets(res.data, { applySafeguards: true }),
            }),
            60,
          );
        } catch (error) {
          return jsonError("geckoterminal", error);
        }
      },
    },
  },
});
