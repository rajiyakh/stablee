import { arbitrum, base, bsc, mainnet, optimism, polygon, type Chain } from "viem/chains";
import { robinhoodChain, robinhoodChainFacts } from "./robinhoodChain";
import { isWalletConfigured } from "./project";

const env = import.meta.env as Record<string, string | undefined>;

/**
 * Common EVM source chains a user might bridge FROM into Robinhood Mainnet.
 * Sourced from viem's own built-in chain definitions — correct chain id,
 * native currency, default public RPC and explorer for each, so nothing
 * here is guessed the way a hand-typed RPC URL could be. Robinhood Chain
 * itself is the one exception (not in viem/chains) and is never re-defined
 * here — it's imported from the existing single source of truth.
 */
const COMMON_BRIDGE_CHAINS: Chain[] = [mainnet, arbitrum, base, optimism, polygon, bsc];

/**
 * viem's single bundled default RPC per chain (used by a bare `http()`) is
 * not reliable for every chain — mainnet's in particular
 * (https://ethereum.reth.rs/rpc) was confirmed live to return a JSON-RPC
 * error on a real eth_getBalance call, causing "Balance unavailable" for a
 * genuinely connected wallet. Every URL below was live-verified (curl,
 * eth_chainId/eth_getBalance) against PublicNode, a well-known public
 * multi-chain RPC provider, before being added here — used as the primary
 * transport in wagmi.ts, with viem's bundled default kept as a fallback.
 */
export const BRIDGE_CHAIN_RPC_URLS: Record<number, string> = {
  [mainnet.id]: "https://ethereum-rpc.publicnode.com",
  [arbitrum.id]: "https://arbitrum-one-rpc.publicnode.com",
  [base.id]: "https://base-rpc.publicnode.com",
  [optimism.id]: "https://optimism-rpc.publicnode.com",
  [polygon.id]: "https://polygon-bor-rpc.publicnode.com",
  [bsc.id]: "https://bsc-rpc.publicnode.com",
};

/** VITE_BRIDGE_ENABLED is the hard kill-switch for the whole multi-chain wallet config. */
export function isBridgeEnabled(): boolean {
  return (env.VITE_BRIDGE_ENABLED ?? "").trim() === "true";
}

/**
 * Ungated — safe for server-side reads (RPC calls, status endpoints) that
 * don't depend on the wallet-connect UI being toggled on. Robinhood Chain
 * first when its own facts are configured.
 */
export function bridgeChainFacts(): Chain[] {
  const chains = robinhoodChainFacts ? [robinhoodChainFacts, ...COMMON_BRIDGE_CHAINS] : [];
  return dedupeById(chains);
}

/**
 * Gated behind isWalletConfigured() && isBridgeEnabled() — for wagmi/Privy.
 * Returns null (never a partial/half-valid tuple) when either gate is off,
 * so callers fall back to the existing single-chain config unchanged. When
 * present, Robinhood Chain is always index 0 (wagmi's default chain).
 */
export function bridgeWalletChains(): readonly [Chain, ...Chain[]] | null {
  if (!isWalletConfigured() || !isBridgeEnabled() || !robinhoodChain) return null;
  const chains = dedupeById([robinhoodChain, ...COMMON_BRIDGE_CHAINS]);
  if (chains.length === 0) return null;
  return chains as [Chain, ...Chain[]];
}

export function findBridgeChain(chainId: number): Chain | undefined {
  return bridgeChainFacts().find((c) => c.id === chainId);
}

export const BRIDGE_CHAIN_IDS: readonly number[] = [
  ...(robinhoodChainFacts ? [robinhoodChainFacts.id] : []),
  ...COMMON_BRIDGE_CHAINS.map((c) => c.id),
];

function dedupeById(chains: Chain[]): Chain[] {
  const seen = new Set<number>();
  const result: Chain[] = [];
  for (const chain of chains) {
    if (seen.has(chain.id)) continue;
    seen.add(chain.id);
    result.push(chain);
  }
  return result;
}
