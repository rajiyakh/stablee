import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import {
  envelope,
  guard,
  invalidParams,
  jsonError,
  jsonOk,
  notConfigured,
} from "@/lib/market/api.server";
import { fetchGmgnHotSearches, gmgnConfigured } from "@/providers/gmgn/client.server";
import { normalizeHotSearches } from "@/providers/gmgn/normalize";
import { gmgnHotSearchesResponseSchema } from "@/providers/gmgn/schemas";

const intervalSchema = z.enum(["1m", "5m", "1h", "6h", "24h"]);
const limitSchema = z.coerce.number().int().min(1).max(100);

export const Route = createFileRoute("/api/market/gmgn/hot-searches")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "gmgn-hot-searches");
        if (limited) return limited;

        if (!gmgnConfigured()) {
          return notConfigured(
            "gmgn",
            "GMGN market data is not configured. Add a valid GMGN API key to enable Robinhood Mainnet Trending and Hot Searches.",
          );
        }

        const url = new URL(request.url);
        const intervalParam = url.searchParams.get("interval") ?? "1h";
        const limitParam = url.searchParams.get("limit") ?? "100";

        const interval = intervalSchema.safeParse(intervalParam);
        if (!interval.success) return invalidParams("gmgn");
        const limit = limitSchema.safeParse(limitParam);
        if (!limit.success) return invalidParams("gmgn");

        try {
          const res = await fetchGmgnHotSearches({
            chain: "robinhood",
            interval: interval.data,
            limit: limit.data,
          });
          const blocks = gmgnHotSearchesResponseSchema.parse(res.data);
          const robinhoodBlock = blocks.find((block) => block.chain === "robinhood") ?? blocks[0];
          const data = robinhoodBlock
            ? normalizeHotSearches(robinhoodBlock.tokens, interval.data)
            : [];
          return jsonOk(envelope("gmgn", { ...res, data }), 45);
        } catch (error) {
          return jsonError("gmgn", error);
        }
      },
    },
  },
});
