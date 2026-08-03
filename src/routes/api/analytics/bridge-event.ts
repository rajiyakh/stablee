import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { guard, invalidParams } from "@/lib/market/api.server";

const eventSchema = z.enum([
  "quote_requested",
  "route_selected",
  "approval_submitted",
  "bridge_submitted",
  "bridge_completed",
  "bridge_failed",
]);

const payloadSchema = z.object({
  event: eventSchema,
  provider: z.string().optional(),
  fromChain: z.string().optional(),
  toChain: z.string().optional(),
  fromTokenSymbol: z.string().optional(),
  toTokenSymbol: z.string().optional(),
  inputUsd: z.number().optional(),
  outputUsd: z.number().optional(),
  platformFeeUsd: z.number().optional(),
  completionTimeSeconds: z.number().optional(),
  errorCode: z.string().optional(),
});

/**
 * First-party, credential-free analytics sink for the Bridge feature —
 * mirrors src/routes/api/analytics/swap-event.ts exactly. Never accepts or
 * logs anything beyond payloadSchema's fields — no wallet addresses, no
 * private keys, no signed transaction payloads, no full provider responses.
 */
export const Route = createFileRoute("/api/analytics/bridge-event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const limited = guard(request, "bridge-analytics");
        if (limited) return limited;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return invalidParams("bridge");
        }

        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) return invalidParams("bridge");

        console.log("[bridge analytics]", JSON.stringify(parsed.data));

        return new Response(null, { status: 204 });
      },
    },
  },
});
