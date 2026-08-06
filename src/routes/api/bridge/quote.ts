import { createFileRoute } from "@tanstack/react-router";
import {
  envelope,
  guard,
  invalidParams,
  jsonError,
  jsonOk,
  notConfigured,
} from "@/lib/market/api.server";
import { enabledAdapters } from "@/lib/bridge/registry.server";
import { bridgeTreasuryAddress } from "@/lib/bridge/feeConfig.server";
import { bridgeQuoteRequestSchema } from "@/lib/bridge/requestSchemas";
import { fetchBridgeRoutes } from "@/lib/bridge/routeEngine.server";

export const Route = createFileRoute("/api/bridge/quote")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Tighter than the 90/min default — one allowed request here fans
        // out to up to four paid upstream provider APIs.
        const limited = guard(request, "bridge-quote", 30, 60_000);
        if (limited) return limited;

        if (!bridgeTreasuryAddress()) {
          return notConfigured(
            "bridge",
            "RobinPulse bridge fee collection has not been configured. Live bridging is unavailable.",
          );
        }
        if (enabledAdapters().length === 0) {
          return notConfigured("bridge", "No bridge providers are configured yet.");
        }

        const url = new URL(request.url);
        const parsed = bridgeQuoteRequestSchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return invalidParams("bridge");

        try {
          const result = await fetchBridgeRoutes(
            {
              fromChainId: parsed.data.fromChainId,
              toChainId: parsed.data.toChainId,
              fromToken: parsed.data.fromToken,
              toToken: parsed.data.toToken,
              fromAmount: parsed.data.fromAmount,
              sender: parsed.data.sender,
              recipient: parsed.data.recipient,
              slippageBps: parsed.data.slippageBps ?? null,
            },
            parsed.data.sort ?? "bestReturn",
          );

          return jsonOk(
            envelope("bridge", {
              data: result,
              fetchedAt: new Date().toISOString(),
              cached: false,
              stale: false,
            }),
            0,
            { private: true },
          );
        } catch (error) {
          return jsonError("bridge", error);
        }
      },
    },
  },
});
