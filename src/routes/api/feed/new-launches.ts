import { createFileRoute } from "@tanstack/react-router";
import { getNewLaunchesOnly } from "@/lib/feed/engine.server";
import { guard } from "@/lib/market/api.server";

/**
 * Lightweight sibling of /api/feed/snapshot — same underlying market data,
 * but skips agent-message generation and the snapshot store mutation, so
 * it's safe to call from a site-wide component (the header ticker) without
 * paying for a full feed-snapshot computation on every page load.
 */
export const Route = createFileRoute("/api/feed/new-launches")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "feed-new-launches");
        if (limited) return limited;

        try {
          const newLaunches = await getNewLaunchesOnly();
          return new Response(JSON.stringify({ data: newLaunches, error: null }), {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          });
        } catch {
          return new Response(
            JSON.stringify({
              data: null,
              error: {
                code: "new_launches_unavailable",
                message: "New launches are temporarily unavailable.",
              },
            }),
            {
              status: 502,
              headers: { "content-type": "application/json; charset=utf-8" },
            },
          );
        }
      },
    },
  },
});
