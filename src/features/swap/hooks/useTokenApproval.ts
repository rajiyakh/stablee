import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { robinhoodChain } from "@/config/robinhoodChain";
import { erc20Abi } from "@/lib/swap/erc20";
import type { ZeroExQuoteResponse } from "@/lib/swap/schemas";
import type { ValidatedQuote } from "@/lib/swap/validateQuote";

/**
 * The ONLY place in the app that calls ERC-20 approve(). The parameter type
 * is ValidatedQuote<...> — a raw, unvalidated 0x response cannot be passed
 * here; it must have already gone through validateQuote()'s success branch.
 * The spender is read only from issues.allowance.spender (never any other
 * field, never a caller-supplied address), and the amount defaults to the
 * exact sellAmount from the quote — never maxUint256 / unlimited.
 */
export function useTokenApproval(quote: ValidatedQuote<ZeroExQuoteResponse> | null) {
  const { writeContract, data: hash, isPending: isApproving, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const spender = quote?.liquidityAvailable ? (quote.issues?.allowance?.spender ?? null) : null;
  const sellToken = quote?.liquidityAvailable ? quote.sellToken : null;
  const exactAmount = quote?.liquidityAvailable ? BigInt(quote.sellAmount) : null;
  const allowanceRequired = Boolean(spender);

  function approveExact() {
    if (!spender || !sellToken || exactAmount === null || !robinhoodChain) return;
    writeContract({
      address: sellToken as `0x${string}`,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender as `0x${string}`, exactAmount],
      // Explicit chainId — wagmi requires the connected wallet to be on
      // this chain (or switches it) before signing, so an approval can
      // never be silently signed on whatever chain the wallet happens to
      // be on at click time.
      chainId: robinhoodChain.id,
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
