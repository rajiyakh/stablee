import { createFileRoute } from "@tanstack/react-router";
import { envelope, guard, jsonError, jsonOk } from "@/lib/market/api.server";
import { allSwapTokens } from "@/lib/swap/discoverTokens.server";

export const Route = createFileRoute("/api/swap/tokens")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "swap-tokens");
        if (limited) return limited;

        try {
          const tokens = await allSwapTokens();
          return jsonOk(
            envelope("zeroex", {
              data: tokens,
              fetchedAt: new Date().toISOString(),
              cached: false,
              stale: false,
            }),
            60,
          );
        } catch (error) {
          return jsonError("zeroex", error);
        }
      },
    },
  },
});
