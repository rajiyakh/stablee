import { defineChain, type Chain } from "viem";
import { projectConfig, isWalletConfigured } from "./project";

/** True whenever the chain facts themselves are present — independent of whether the wallet-connect UI is toggled on. */
function chainFactsPresent(): boolean {
  const w = projectConfig.wallet;
  return Boolean(
    w.chainId !== null &&
    w.chainName &&
    w.rpcUrl &&
    w.explorerUrl &&
    w.nativeCurrencyName &&
    w.nativeCurrencySymbol,
  );
}

function buildChain(): Chain | null {
  if (!chainFactsPresent()) return null;
  return defineChain({
    id: projectConfig.wallet.chainId!,
    name: projectConfig.wallet.chainName,
    nativeCurrency: {
      name: projectConfig.wallet.nativeCurrencyName,
      symbol: projectConfig.wallet.nativeCurrencySymbol,
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [projectConfig.wallet.rpcUrl] },
    },
    blockExplorers: {
      default: { name: "Robinhood Chain Blockscout", url: projectConfig.wallet.explorerUrl },
    },
  });
}

/**
 * For server-side reads only (on-chain decimals lookups, Chainlink price
 * feeds) — available whenever the chain facts are configured, independent
 * of VITE_WALLET_ENABLED. A read-only RPC call has no dependency on
 * WalletConnect readiness or the wallet UI being toggled on for end users.
 */
export const robinhoodChainFacts: Chain | null = buildChain();

/**
 * For the client-facing wallet UI / wagmi provider. Gated additionally
 * behind `isWalletConfigured()` (VITE_WALLET_ENABLED + WalletConnect project
 * ID) — field values are sourced from projectConfig.wallet (itself
 * env-driven from VITE_ROBINHOOD_* vars) rather than a second hardcoded
 * copy of the same chain facts, so .env stays the single source of truth.
 * Returns null when not ready yet — every consumer checks for null instead
 * of a half-valid chain.
 */
export const robinhoodChain: Chain | null = isWalletConfigured() ? buildChain() : null;
