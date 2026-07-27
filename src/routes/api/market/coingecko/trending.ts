import { createFileRoute } from "@tanstack/react-router";
import { getTrending } from "@/lib/market/coingecko.server";
import { envelope, guard, jsonError, jsonOk } from "@/lib/market/api.server";

export const Route = createFileRoute("/api/market/coingecko/trending")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "cg-trending");
        if (limited) return limited;
        try {
          return jsonOk(envelope("coingecko", await getTrending()), 60);
        } catch (error) {
          return jsonError("coingecko", error);
        }
      },
    },
  },
});
