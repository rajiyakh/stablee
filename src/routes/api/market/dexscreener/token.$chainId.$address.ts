import { createFileRoute } from "@tanstack/react-router";
import { getTokenPairs } from "@/lib/market/dexscreener.server";
import {
  addressSchema,
  chainSchema,
  envelope,
  guard,
  invalidParams,
  jsonError,
  jsonOk,
} from "@/lib/market/api.server";

export const Route = createFileRoute("/api/market/dexscreener/token/$chainId/$address")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const limited = guard(request, "ds-token");
        if (limited) return limited;
        const chain = chainSchema.safeParse(params.chainId);
        const address = addressSchema.safeParse(params.address);
        if (!chain.success || !address.success) return invalidParams("dexscreener");
        try {
          return jsonOk(envelope("dexscreener", await getTokenPairs(chain.data, address.data)), 30);
        } catch (error) {
          return jsonError("dexscreener", error);
        }
      },
    },
  },
});
