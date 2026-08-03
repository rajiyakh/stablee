import { createFileRoute } from "@tanstack/react-router";
import { envelope, guard, jsonOk, notConfigured } from "@/lib/market/api.server";
import { supportedChainsUnion, enabledAdapters } from "@/lib/bridge/registry.server";
import { bridgeTreasuryAddress } from "@/lib/bridge/feeConfig.server";

export const Route = createFileRoute("/api/bridge/chains")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "bridge-chains");
        if (limited) return limited;

        if (!bridgeTreasuryAddress() || enabledAdapters().length === 0) {
          return notConfigured(
            "bridge",
            "Bridging is not configured yet — no treasury address or provider credentials are set.",
          );
        }

        const chains = await supportedChainsUnion();
        return jsonOk(
          envelope("bridge", {
            data: chains,
            fetchedAt: new Date().toISOString(),
            cached: false,
            stale: false,
          }),
          60,
        );
      },
    },
  },
});
