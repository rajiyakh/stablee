import { useRef } from "react";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import type { ValidatedBridgeQuote } from "@/lib/bridge/validateBridgeQuote";

/**
 * Sends the exact transaction the provider returned — calldata is never
 * modified, mirrors useSwapExecution.ts. Only accepts a ValidatedBridgeQuote.
 * Tracks submitted routeIds in a ref so the same quote can never be
 * submitted twice, even if the confirm button is double-clicked before
 * React re-renders it disabled.
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
  const submittedRouteIds = useRef<Set<string>>(new Set());

  function executeBridge(quote: ValidatedBridgeQuote) {
    if (!quote.transactionRequest) return;
    if (submittedRouteIds.current.has(quote.routeId)) return;
    submittedRouteIds.current.add(quote.routeId);

    const tx = quote.transactionRequest;
    sendTransaction({
      to: tx.to as `0x${string}`,
      data: tx.data as `0x${string}`,
      value: BigInt(tx.value || "0"),
      // Explicit chainId from the quote itself — calldata built for the
      // source chain can never be silently signed on another chain.
      chainId: tx.chainId,
    });
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
