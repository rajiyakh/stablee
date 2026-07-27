import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { robinhoodChain } from "@/config/robinhoodChain";
import type { ZeroExQuoteResponse } from "@/lib/swap/schemas";
import type { ValidatedQuote } from "@/lib/swap/validateQuote";

/**
 * Sends the exact transaction 0x returned — calldata is never modified.
 * Only accepts a ValidatedQuote (see useTokenApproval.ts for the same
 * pattern), so an unvalidated response cannot reach sendTransaction.
 */
export function useSwapExecution() {
  const { sendTransaction, data: hash, isPending: isSwapping, error, reset } = useSendTransaction();
  const receipt = useWaitForTransactionReceipt({ hash });

  function executeSwap(quote: ValidatedQuote<ZeroExQuoteResponse>) {
    if (!quote.liquidityAvailable || !robinhoodChain) return;
    const tx = quote.transaction;
    sendTransaction({
      to: tx.to as `0x${string}`,
      data: tx.data as `0x${string}`,
      value: BigInt(tx.value || "0"),
      gas: tx.gas ? BigInt(tx.gas) : undefined,
      // Explicit chainId — wagmi requires the connected wallet to be on
      // this chain (or switches it) before signing, so the calldata built
      // for Robinhood Chain can never be silently signed elsewhere.
      chainId: robinhoodChain.id,
    });
  }

  return {
    executeSwap,
    hash,
    isSwapping,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    receipt: receipt.data ?? null,
    error,
    reset,
  };
}
