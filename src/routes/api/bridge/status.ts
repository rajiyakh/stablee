import { createFileRoute } from "@tanstack/react-router";
import { envelope, guard, invalidParams, jsonError, jsonOk } from "@/lib/market/api.server";
import { allAdapters } from "@/lib/bridge/registry.server";
import { bridgeStatusRequestSchema } from "@/lib/bridge/requestSchemas";

export const Route = createFileRoute("/api/bridge/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "bridge-status");
        if (limited) return limited;

        const url = new URL(request.url);
        const parsed = bridgeStatusRequestSchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return invalidParams("bridge");

        const adapter = allAdapters().find((a) => a.id === parsed.data.provider);
        if (!adapter) return invalidParams("bridge");

        try {
          const status = await adapter.getTransactionStatus({
            routeId: parsed.data.routeId,
            txHash: parsed.data.txHash,
            fromChainId: parsed.data.fromChainId,
            toChainId: parsed.data.toChainId,
          });
          return jsonOk(
            envelope("bridge", {
              data: status,
              fetchedAt: new Date().toISOString(),
              cached: false,
              stale: false,
            }),
            0,
          );
        } catch (error) {
          return jsonError("bridge", error);
        }
      },
    },
  },
});
