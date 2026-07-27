import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getCoin } from "@/lib/market/coingecko.server";
import { envelope, guard, jsonError, jsonOk } from "@/lib/market/api.server";

const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9._-]+$/i);

export const Route = createFileRoute("/api/market/coingecko/coin/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const limited = guard(request, "cg-coin");
        if (limited) return limited;
        const parsed = idSchema.safeParse(params.id);
        if (!parsed.success) return jsonError("coingecko", new Error("invalid id"));
        try {
          return jsonOk(envelope("coingecko", await getCoin(parsed.data)), 45);
        } catch (error) {
          return jsonError("coingecko", error);
        }
      },
    },
  },
});
