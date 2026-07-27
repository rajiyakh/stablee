import { createFileRoute } from "@tanstack/react-router";
import { geckoTerminalConfigured, getNetworks } from "@/lib/market/geckoterminal.server";
import { envelope, guard, jsonError, jsonOk, notConfigured } from "@/lib/market/api.server";

export const Route = createFileRoute("/api/market/geckoterminal/networks")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "gt-networks");
        if (limited) return limited;
        if (!geckoTerminalConfigured()) {
          return notConfigured(
            "geckoterminal",
            "No GeckoTerminal network identifier has been configured for Robinhood Mainnet.",
          );
        }
        try {
          return jsonOk(envelope("geckoterminal", await getNetworks()), 600);
        } catch (error) {
          return jsonError("geckoterminal", error);
        }
      },
    },
  },
});
