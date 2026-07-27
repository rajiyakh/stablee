import { createFileRoute } from "@tanstack/react-router";
import { searchPairs } from "@/lib/market/dexscreener.server";
import {
  envelope,
  guard,
  jsonError,
  jsonOk,
  queryString,
  searchQuerySchema,
} from "@/lib/market/api.server";

export const Route = createFileRoute("/api/market/dexscreener/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "ds-search");
        if (limited) return limited;
        const parsed = searchQuerySchema.safeParse(queryString(request).get("q") ?? "");
        if (!parsed.success) return jsonError("dexscreener", new Error("invalid query"));
        try {
          return jsonOk(envelope("dexscreener", await searchPairs(parsed.data)), 30);
        } catch (error) {
          return jsonError("dexscreener", error);
        }
      },
    },
  },
});
