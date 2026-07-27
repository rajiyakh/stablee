import { createFileRoute } from "@tanstack/react-router";
import { geckoTerminalConfigured, getPools } from "@/lib/market/geckoterminal.server";
import {
  chainSchema,
  envelope,
  guard,
  jsonError,
  jsonOk,
  notConfigured,
} from "@/lib/market/api.server";

export const Route = createFileRoute("/api/market/geckoterminal/pools/$networkId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const limited = guard(request, "gt-pools");
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
          return jsonOk(envelope("geckoterminal", await getPools(network.data)), 60);
        } catch (error) {
          return jsonError("geckoterminal", error);
        }
      },
    },
  },
});
