import { formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { robinhoodChain } from "@/config/robinhoodChain";
import { erc20Abi } from "@/lib/swap/erc20";
import type { SwapTokenConfig } from "@/config/swapTokens";

/**
 * Real ERC-20 balanceOf() read for the connected wallet's sell-token
 * balance. Native-asset balance reading isn't wired (native selling is
 * disabled — see swapTokens.ts's NATIVE_SELL_ENABLED), so this is always
 * the ERC-20 path. Never a placeholder value.
 */
export function useSwapTokenBalance(token: SwapTokenConfig | null) {
  const { address, isConnected } = useAccount();

  const query = useReadContract({
    address: token ? (token.address as `0x${string}`) : undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: robinhoodChain?.id,
    query: { enabled: Boolean(isConnected && address && token && robinhoodChain) },
  });

  const formatted =
    query.data !== undefined && token ? formatUnits(query.data, token.decimals) : null;

  return {
    balance: query.data ?? null,
    formatted,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
