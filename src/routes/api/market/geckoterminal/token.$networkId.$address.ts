import { createFileRoute } from "@tanstack/react-router";
import { geckoTerminalConfigured, getTokenPools } from "@/lib/market/geckoterminal.server";
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

export const Route = createFileRoute("/api/market/geckoterminal/token/$networkId/$address")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const limited = guard(request, "gt-token");
        if (limited) return limited;
        if (!geckoTerminalConfigured()) {
          return notConfigured(
            "geckoterminal",
            "GeckoTerminal is not activated because no network identifier is configured.",
          );
        }
        const network = chainSchema.safeParse(params.networkId);
        const address = addressSchema.safeParse(params.address);
        if (!network.success || !address.success) return invalidParams("geckoterminal");
        try {
          return jsonOk(
            envelope("geckoterminal", await getTokenPools(network.data, address.data)),
            45,
          );
        } catch (error) {
          return jsonError("geckoterminal", error);
        }
      },
    },
  },
});
