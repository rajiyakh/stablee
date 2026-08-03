import { useQuery } from "@tanstack/react-query";
import { bridgeStatusQuery } from "@/lib/bridge/client";
import type { BridgeStatusState } from "@/lib/bridge/types";

const TERMINAL_STATES: BridgeStatusState[] = ["completed", "failed", "refunded"];

/**
 * Polls /api/bridge/status every 8s (see bridgeStatusQuery) until the
 * status reaches a terminal state, then stops. "completed" is only ever
 * reported by the server after the provider confirms the destination leg
 * — see status.ts's mapProviderStatus, never inferred client-side.
 */
export function useBridgeStatus(
  provider: string | null,
  routeId: string | null,
  txHash: string | null,
  fromChainId: number | null,
  toChainId: number | null,
) {
  const enabled = Boolean(provider && routeId && txHash && fromChainId && toChainId);
  const query = useQuery(
    bridgeStatusQuery(
      provider ?? "",
      routeId ?? "",
      txHash ?? "",
      fromChainId ?? 0,
      toChainId ?? 0,
      enabled,
    ),
  );

  const status = query.data?.data ?? null;
  const isTerminal = status ? TERMINAL_STATES.includes(status.state) : false;

  return { status, isLoading: query.isLoading, isTerminal, refetch: query.refetch };
}
