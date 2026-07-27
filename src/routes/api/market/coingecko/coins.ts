import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getCoinMarkets, getTopMarkets } from "@/lib/market/coingecko.server";
import { envelope, guard, jsonError, jsonOk, queryString } from "@/lib/market/api.server";

const idsSchema = z
  .string()
  .trim()
  .max(600)
  .regex(/^[a-z0-9,_-]*$/i);

export const Route = createFileRoute("/api/market/coingecko/coins")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "cg-coins");
        if (limited) return limited;
        const params = queryString(request);
        const idsRaw = params.get("ids") ?? "";
        const parsed = idsSchema.safeParse(idsRaw);
        if (!parsed.success) return jsonError("coingecko", new Error("invalid ids"));
        const ids = parsed.data
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 50);
        try {
          const result = ids.length ? await getCoinMarkets(ids) : await getTopMarkets(1, 50);
          return jsonOk(envelope("coingecko", result), 45);
        } catch (error) {
          return jsonError("coingecko", error);
        }
      },
    },
  },
});
