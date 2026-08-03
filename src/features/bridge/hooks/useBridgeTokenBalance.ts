import { formatUnits } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { erc20Abi } from "@/lib/swap/erc20";
import { BRIDGE_CHAIN_IDS } from "@/config/bridgeChains";
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
  // Belt-and-suspenders: wagmi throws ChainNotConfiguredError for any
  // chainId outside its own config, which otherwise surfaces as a scary
  // "Balance unavailable" even though nothing is actually wrong — the chain
  // just isn't one the wallet can sign/read on. BridgePage already filters
  // its chain picker to this same set, but this hook stays defensive on its
  // own so it can never regress into that error state again.
  const chainSupported = chainId !== null && BRIDGE_CHAIN_IDS.includes(chainId);

  const erc20Query = useReadContract({
    address: token && !native ? (token.address as `0x${string}`) : undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: chainId ?? undefined,
    query: {
      enabled: Boolean(isConnected && address && token && !native && chainId && chainSupported),
    },
  });

  const nativeQuery = useBalance({
    address,
    chainId: chainId ?? undefined,
    query: {
      enabled: Boolean(isConnected && address && token && native && chainId && chainSupported),
    },
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
