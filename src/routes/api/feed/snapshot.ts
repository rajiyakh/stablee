import { createFileRoute } from "@tanstack/react-router";
import { getFeedSnapshot } from "@/lib/feed/engine.server";
import { guard } from "@/lib/market/api.server";

export const Route = createFileRoute("/api/feed/snapshot")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "feed-snapshot");
        if (limited) return limited;

        try {
          const snapshot = await getFeedSnapshot();
          return new Response(JSON.stringify({ data: snapshot, error: null }), {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          });
        } catch {
          // Upstream error detail is intentionally never forwarded to the client — see SECURITY_REVIEW.md.
          return new Response(
            JSON.stringify({
              data: null,
              error: { code: "feed_unavailable", message: "The feed is temporarily unavailable." },
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
