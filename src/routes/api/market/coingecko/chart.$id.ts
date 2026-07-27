import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getChart } from "@/lib/market/coingecko.server";
import {
  envelope,
  guard,
  invalidParams,
  jsonError,
  jsonOk,
  queryString,
} from "@/lib/market/api.server";

const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9._-]+$/i);
const daysSchema = z.enum(["1", "7", "14", "30", "90", "365", "max"]);

export const Route = createFileRoute("/api/market/coingecko/chart/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const limited = guard(request, "cg-chart");
        if (limited) return limited;
        const id = idSchema.safeParse(params.id);
        const days = daysSchema.safeParse(queryString(request).get("days") ?? "7");
        if (!id.success || !days.success) return invalidParams("coingecko");
        try {
          return jsonOk(envelope("coingecko", await getChart(id.data, days.data)), 300);
        } catch (error) {
          return jsonError("coingecko", error);
        }
      },
    },
  },
});
