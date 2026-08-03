import { createFileRoute } from "@tanstack/react-router";
import { envelope, guard, invalidParams, jsonOk, notConfigured } from "@/lib/market/api.server";
import { supportedTokensUnion, enabledAdapters } from "@/lib/bridge/registry.server";
import { bridgeTreasuryAddress } from "@/lib/bridge/feeConfig.server";
import { bridgeTokensRequestSchema } from "@/lib/bridge/requestSchemas";

export const Route = createFileRoute("/api/bridge/tokens")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "bridge-tokens");
        if (limited) return limited;

        if (!bridgeTreasuryAddress() || enabledAdapters().length === 0) {
          return notConfigured(
            "bridge",
            "Bridging is not configured yet — no treasury address or provider credentials are set.",
          );
        }

        const url = new URL(request.url);
        const parsed = bridgeTokensRequestSchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return invalidParams("bridge");

        const tokens = await supportedTokensUnion(parsed.data.chainId);
        return jsonOk(
          envelope("bridge", {
            data: tokens,
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
