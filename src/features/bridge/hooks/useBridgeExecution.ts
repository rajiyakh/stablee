import { useRef } from "react";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import type { ValidatedBridgeQuote } from "@/lib/bridge/validateBridgeQuote";

/**
 * Sends the exact transaction the provider returned — calldata is never
 * modified, mirrors useSwapExecution.ts. Only accepts a ValidatedBridgeQuote.
 * Tracks routeIds that are currently in-flight (submitted to the wallet but
 * not yet resolved) in a ref so the same quote can never be double-submitted
 * even if the confirm button is clicked twice before React re-renders it
 * disabled — but a rejected/failed send frees the routeId immediately so the
 * user can retry the same route rather than having it permanently blocked
 * for the rest of the session.
 */
export function useBridgeExecution() {
  const {
    sendTransaction,
    data: hash,
    isPending: isSubmitting,
    error,
    reset,
  } = useSendTransaction();
  const receipt = useWaitForTransactionReceipt({ hash });
  const inFlightRouteIds = useRef<Set<string>>(new Set());

  function executeBridge(quote: ValidatedBridgeQuote) {
    if (!quote.transactionRequest) return;
    if (inFlightRouteIds.current.has(quote.routeId)) return;
    inFlightRouteIds.current.add(quote.routeId);

    const tx = quote.transactionRequest;
    sendTransaction(
      {
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: BigInt(tx.value || "0"),
        // Explicit chainId from the quote itself — calldata built for the
        // source chain can never be silently signed on another chain.
        chainId: tx.chainId,
      },
      {
        onError: () => inFlightRouteIds.current.delete(quote.routeId),
      },
    );
  }

  return {
    executeBridge,
    hash,
    isSubmitting,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    receipt: receipt.data ?? null,
    error,
    reset,
  };
}
