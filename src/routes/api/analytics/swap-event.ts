import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { guard, invalidParams } from "@/lib/market/api.server";

const eventSchema = z.enum([
  "quote_requested",
  "quote_successful",
  "quote_failed",
  "approval_submitted",
  "approval_confirmed",
  "swap_submitted",
  "swap_confirmed",
  "swap_reverted",
]);

const payloadSchema = z.object({
  event: eventSchema,
  sellToken: z.string().optional(),
  buyToken: z.string().optional(),
  feeToken: z.string().optional(),
  feeAmount: z.string().optional(),
  feeUsd: z.number().optional(),
  transactionHash: z.string().optional(),
  errorCode: z.string().optional(),
});

/**
 * First-party, credential-free analytics sink: logs the allowlisted,
 * non-sensitive swap event fields server-side, where Vercel's function logs
 * capture them without needing any third-party analytics account. Never
 * accepts or logs anything beyond payloadSchema's fields — no wallet
 * signatures, no full API responses, no secrets.
 */
export const Route = createFileRoute("/api/analytics/swap-event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const limited = guard(request, "swap-analytics");
        if (limited) return limited;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return invalidParams("zeroex");
        }

        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) return invalidParams("zeroex");

        console.log("[swap analytics]", JSON.stringify(parsed.data));

        return new Response(null, { status: 204 });
      },
    },
  },
});
