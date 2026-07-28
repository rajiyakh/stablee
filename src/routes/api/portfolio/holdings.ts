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
import { blockscoutConfigured } from "@/lib/portfolio/blockscout.server";
import { fetchPortfolio } from "@/lib/portfolio/holdings.server";

const addressSchema = z.object({
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, "must be a valid EVM address"),
});

export const Route = createFileRoute("/api/portfolio/holdings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "portfolio-holdings");
        if (limited) return limited;

        if (!blockscoutConfigured()) {
          return notConfigured(
            "blockscout",
            "Robinhood Mainnet's block explorer is not configured. Portfolio data is unavailable.",
          );
        }

        const url = new URL(request.url);
        const parsed = addressSchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return invalidParams("blockscout");

        try {
          const fetchedAt = Date.now();
          const data = await fetchPortfolio(parsed.data.address);
          return jsonOk(
            envelope("blockscout", {
              data,
              fetchedAt: new Date(fetchedAt).toISOString(),
              cached: false,
              stale: false,
            }),
            15,
          );
        } catch (error) {
          return jsonError("blockscout", error);
        }
      },
    },
  },
});
