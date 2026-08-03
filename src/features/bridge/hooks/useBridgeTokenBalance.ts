import { formatUnits } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { erc20Abi } from "@/lib/swap/erc20";
import { BRIDGE_NATIVE_SENTINEL } from "@/lib/bridge/types";
import type { SupportedToken } from "@/lib/bridge/types";

function isNativeBridgeToken(token: SupportedToken | null): boolean {
  return token?.address.toLowerCase() === BRIDGE_NATIVE_SENTINEL.toLowerCase();
}

/**
 * Chain-parameterized counterpart to swap's useSwapTokenBalance — bridging
 * reads a balance on the selected SOURCE chain, not always Robinhood Chain.
 * Same real-balance-only discipline: ERC-20 balanceOf() for token
 * contracts, wagmi's native useBalance() for the native sentinel.
 */
export function useBridgeTokenBalance(token: SupportedToken | null, chainId: number | null) {
  const { address, isConnected } = useAccount();
  const native = isNativeBridgeToken(token);

  const erc20Query = useReadContract({
    address: token && !native ? (token.address as `0x${string}`) : undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: chainId ?? undefined,
    query: { enabled: Boolean(isConnected && address && token && !native && chainId) },
  });

  const nativeQuery = useBalance({
    address,
    chainId: chainId ?? undefined,
    query: { enabled: Boolean(isConnected && address && token && native && chainId) },
  });

  const value = native ? nativeQuery.data?.value : erc20Query.data;
  const formatted = value !== undefined && token ? formatUnits(value, token.decimals) : null;
  const activeQuery = native ? nativeQuery : erc20Query;

  return {
    balance: value ?? null,
    formatted,
    isLoading: activeQuery.isLoading,
    isError: activeQuery.isError,
    refetch: activeQuery.refetch,
  };
}
