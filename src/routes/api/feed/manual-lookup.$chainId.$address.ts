import { createFileRoute } from "@tanstack/react-router";
import { buildManualAgentPost } from "@/lib/feed/manualLookup.server";
import {
  addressSchema,
  chainSchema,
  customError,
  envelope,
  guard,
  invalidParams,
  jsonError,
  jsonOk,
} from "@/lib/market/api.server";

export const Route = createFileRoute("/api/feed/manual-lookup/$chainId/$address")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        // Stricter than the default 90/min: unlike a cached read, every
        // distinct pasted address costs a real upstream DEX Screener call.
        const limited = guard(request, "feed-manual-lookup", 20, 60_000);
        if (limited) return limited;

        const chain = chainSchema.safeParse(params.chainId);
        const address = addressSchema.safeParse(params.address);
        if (!chain.success || !address.success) return invalidParams("dexscreener");

        try {
          const result = await buildManualAgentPost(chain.data, address.data);
          if (!result.ok) {
            return customError(
              "dexscreener",
              result.code,
              result.message,
              result.code === "not_found" ? 404 : 200,
            );
          }

          const { fetchedAt, stale, ...payload } = result;
          return jsonOk(
            envelope("dexscreener", { data: payload, fetchedAt, cached: false, stale }),
            15,
          );
        } catch (error) {
          return jsonError("dexscreener", error);
        }
      },
    },
  },
});
