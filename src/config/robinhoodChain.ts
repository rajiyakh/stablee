import { defineChain, type Chain } from "viem";
import { projectConfig, isWalletConfigured } from "./project";

/**
 * Robinhood Chain as a viem/wagmi Chain object. Field values are sourced from
 * projectConfig.wallet (itself env-driven from VITE_ROBINHOOD_* vars) rather
 * than a second hardcoded copy of the same chain facts, so .env stays the
 * single source of truth. Returns null when the required fields aren't all
 * present yet — every consumer checks for null instead of a half-valid chain.
 */
export const robinhoodChain: Chain | null = isWalletConfigured()
  ? defineChain({
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
    })
  : null;
