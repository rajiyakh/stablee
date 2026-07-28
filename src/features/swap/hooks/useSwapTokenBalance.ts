import { formatUnits } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { robinhoodChain } from "@/config/robinhoodChain";
import { erc20Abi } from "@/lib/swap/erc20";
import { NATIVE_GAS_RESERVE_WEI, NATIVE_SENTINEL, type SwapTokenConfig } from "@/config/swapTokens";

export function isNativeSwapToken(token: SwapTokenConfig | null): boolean {
  return token?.address.toLowerCase() === NATIVE_SENTINEL.toLowerCase();
}

/**
 * The "Max" amount for a sell. Native-ETH sells must reserve gas (see
 * NATIVE_GAS_RESERVE_WEI) — the ERC-20 path pays gas separately from the
 * token being sold, so its max is the true full balance.
 */
export function computeMaxSellFormatted(
  value: bigint | undefined,
  decimals: number,
  native: boolean,
): string | null {
  if (value === undefined) return null;
  if (!native) return formatUnits(value, decimals);
  const spendable = value > NATIVE_GAS_RESERVE_WEI ? value - NATIVE_GAS_RESERVE_WEI : 0n;
  return formatUnits(spendable, decimals);
}

/**
 * Real balance read for the connected wallet's sell-token: ERC-20
 * balanceOf() for token contracts, wagmi's native useBalance() for the ETH
 * sentinel (balanceOf() would revert against a non-contract address).
 * Never a placeholder value.
 */
export function useSwapTokenBalance(token: SwapTokenConfig | null) {
  const { address, isConnected } = useAccount();
  const native = isNativeSwapToken(token);

  const erc20Query = useReadContract({
    address: token && !native ? (token.address as `0x${string}`) : undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: robinhoodChain?.id,
    query: { enabled: Boolean(isConnected && address && token && !native && robinhoodChain) },
  });

  const nativeQuery = useBalance({
    address,
    chainId: robinhoodChain?.id,
    query: { enabled: Boolean(isConnected && address && token && native && robinhoodChain) },
  });

  const value = native ? nativeQuery.data?.value : erc20Query.data;
  const formatted = value !== undefined && token ? formatUnits(value, token.decimals) : null;
  const maxSellFormatted = token ? computeMaxSellFormatted(value, token.decimals, native) : null;
  const activeQuery = native ? nativeQuery : erc20Query;

  return {
    balance: value ?? null,
    formatted,
    maxSellFormatted,
    // Loading/error are surfaced explicitly (not just "no value yet") so the
    // UI can distinguish "still fetching" and "the read failed, retry" from
    // "wallet not connected" instead of rendering identically blank for all
    // three — a real gap that made a transient RPC hiccup indistinguishable
    // from a permanent bug in the balance line.
    isLoading: activeQuery.isLoading,
    isError: activeQuery.isError,
    refetch: activeQuery.refetch,
  };
}
