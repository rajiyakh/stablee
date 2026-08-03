import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { erc20Abi } from "@/lib/swap/erc20";
import type { ValidatedBridgeQuote } from "@/lib/bridge/validateBridgeQuote";

/**
 * The ONLY place in the Bridge feature that calls ERC-20 approve() —
 * mirrors useTokenApproval.ts exactly. Only a ValidatedBridgeQuote (already
 * passed validateBridgeQuote()'s checks) can be passed here. Spender comes
 * only from the validated quote's approvalTarget (never a caller-supplied
 * address), and the amount is always the exact quoted inputAmount — never
 * maxUint256 / unlimited.
 */
export function useBridgeApproval(quote: ValidatedBridgeQuote | null) {
  const { writeContract, data: hash, isPending: isApproving, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const spender = quote?.approvalTarget ?? null;
  const tokenAddress = quote?.meta.fromToken.address ?? null;
  const exactAmount = quote ? BigInt(quote.inputAmount) : null;
  const allowanceRequired = Boolean(spender);

  function approveExact() {
    if (!spender || !tokenAddress || exactAmount === null || !quote) return;
    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender as `0x${string}`, exactAmount],
      // Explicit chainId — the SOURCE chain of this quote, never whatever
      // chain the wallet happens to be connected to at click time.
      chainId: quote.meta.fromChainId,
    });
  }

  return {
    allowanceRequired,
    spender,
    approveExact,
    hash,
    isApproving,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    error,
    reset,
  };
}
