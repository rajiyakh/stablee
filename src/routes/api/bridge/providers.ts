import { createFileRoute } from "@tanstack/react-router";
import { envelope, guard, jsonOk } from "@/lib/market/api.server";
import { allAdapters } from "@/lib/bridge/registry.server";
import { bridgeTreasuryAddress } from "@/lib/bridge/feeConfig.server";

/**
 * Discloses per-provider configured/enabled/fee-mode state so the Bridge UI
 * can render an honest "why is this provider not showing routes" reason
 * instead of guessing. Never leaks API keys — only booleans and the
 * feeMode label.
 */
export const Route = createFileRoute("/api/bridge/providers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "bridge-providers");
        if (limited) return limited;

        const providers = allAdapters().map((adapter) => ({
          id: adapter.id,
          displayName: adapter.displayName,
          configured: adapter.configured(),
          feeMode: adapter.feeMode(),
        }));

        return jsonOk(
          envelope("bridge", {
            data: { treasuryConfigured: bridgeTreasuryAddress() !== null, providers },
            fetchedAt: new Date().toISOString(),
            cached: false,
            stale: false,
          }),
          30,
        );
      },
    },
  },
});
