import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { envelope, guard, invalidParams, jsonError, jsonOk } from "@/lib/market/api.server";
import { resolveSwapToken } from "@/lib/swap/discoverTokens.server";

const querySchema = z.object({
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, "must be a valid EVM address"),
});

/**
 * Resolves a pasted contract address to a swappable token — curated list
 * first, then GMGN-discovered, then a direct on-chain decimals()/symbol()/
 * name() lookup (see discoverTokens.server.ts's resolveSwapToken()). Returns
 * `{data: null}` (never a 4xx) when the address is well-formed but doesn't
 * resolve to a real ERC-20 contract, so the client can show "not a token"
 * rather than treat it as a request failure.
 */
export const Route = createFileRoute("/api/swap/resolve-token")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "swap-resolve-token");
        if (limited) return limited;

        const url = new URL(request.url);
        const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return invalidParams("zeroex");

        try {
          const token = await resolveSwapToken(parsed.data.address);
          return jsonOk(
            envelope("zeroex", {
              data: token,
              fetchedAt: new Date().toISOString(),
              cached: false,
              stale: false,
            }),
            0,
          );
        } catch (error) {
          return jsonError("zeroex", error);
        }
      },
    },
  },
});
