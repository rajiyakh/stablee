import { createFileRoute } from "@tanstack/react-router";
import { getPair } from "@/lib/market/dexscreener.server";
import {
  chainSchema,
  envelope,
  guard,
  invalidParams,
  jsonError,
  jsonOk,
  queryString,
  addressSchema,
} from "@/lib/market/api.server";

export const Route = createFileRoute("/api/market/dexscreener/pairs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "ds-pairs");
        if (limited) return limited;
        const params = queryString(request);
        const chain = chainSchema.safeParse(params.get("chainId") ?? "");
        const pair = addressSchema.safeParse(params.get("pairId") ?? "");
        if (!chain.success || !pair.success) return invalidParams("dexscreener");
        try {
          return jsonOk(envelope("dexscreener", await getPair(chain.data, pair.data)), 30);
        } catch (error) {
          return jsonError("dexscreener", error);
        }
      },
    },
  },
});
