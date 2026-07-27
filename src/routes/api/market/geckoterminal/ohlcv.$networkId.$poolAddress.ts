import { createFileRoute } from "@tanstack/react-router";
import { geckoTerminalConfigured, getPoolOhlcv } from "@/lib/market/geckoterminal.server";
import {
  addressSchema,
  chainSchema,
  envelope,
  guard,
  invalidParams,
  jsonError,
  jsonOk,
  notConfigured,
} from "@/lib/market/api.server";

export const Route = createFileRoute("/api/market/geckoterminal/ohlcv/$networkId/$poolAddress")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const limited = guard(request, "gt-ohlcv");
        if (limited) return limited;
        if (!geckoTerminalConfigured()) {
          return notConfigured(
            "geckoterminal",
            "GeckoTerminal is not activated because no network identifier is configured.",
          );
        }
        const network = chainSchema.safeParse(params.networkId);
        const pool = addressSchema.safeParse(params.poolAddress);
        if (!network.success || !pool.success) return invalidParams("geckoterminal");
        try {
          return jsonOk(
            envelope("geckoterminal", await getPoolOhlcv(network.data, pool.data)),
            300,
          );
        } catch (error) {
          return jsonError("geckoterminal", error);
        }
      },
    },
  },
});
