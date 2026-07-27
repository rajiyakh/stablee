import { createFileRoute } from "@tanstack/react-router";
import { search } from "@/lib/market/coingecko.server";
import {
  envelope,
  guard,
  jsonError,
  jsonOk,
  queryString,
  searchQuerySchema,
} from "@/lib/market/api.server";

export const Route = createFileRoute("/api/market/coingecko/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "cg-search");
        if (limited) return limited;
        const parsed = searchQuerySchema.safeParse(queryString(request).get("q") ?? "");
        if (!parsed.success) return jsonError("coingecko", new Error("invalid query"));
        try {
          return jsonOk(envelope("coingecko", await search(parsed.data)), 60);
        } catch (error) {
          return jsonError("coingecko", error);
        }
      },
    },
  },
});
