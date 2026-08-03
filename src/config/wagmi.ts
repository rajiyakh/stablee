import { fallback, http } from "wagmi";
import { createConfig } from "@privy-io/wagmi";
import { robinhoodChain } from "./robinhoodChain";
import { BRIDGE_CHAIN_RPC_URLS, bridgeWalletChains } from "./bridgeChains";
import { projectConfig, isWalletConfigured } from "./project";

type PrivyWagmiConfig = ReturnType<typeof createConfig> | null;

let cachedConfig: PrivyWagmiConfig | undefined;

/**
 * Lazily builds the wagmi config so a missing Privy app ID or unconfigured
 * chain never throws at module-import time — that would break every route,
 * not just /swap, since __root.tsx is shared. Returns null (never a
 * half-valid config) when isWalletConfigured() is false.
 *
 * No `connectors` array here — Privy drives wagmi's connector state itself
 * (via `@privy-io/wagmi`'s WagmiProvider, wired in __root.tsx). Passing a
 * manual connectors list would fight Privy's own connector injection.
 *
 * chains defaults to [robinhoodChain] exactly as before. When
 * VITE_BRIDGE_ENABLED is "true", bridgeWalletChains() additionally supplies
 * common source chains (Ethereum, Arbitrum, Base, Optimism, Polygon, BNB)
 * for the bridge feature's source-chain signing — Robinhood Chain always
 * stays index 0 (wagmi's default chain), so existing swap behavior
 * (wrongNetwork checks, explicit chainId on every signing call) is
 * unaffected either way. With the flag unset this is byte-identical to the
 * single-chain config that shipped before bridging existed.
 */
export function getWagmiConfig(): PrivyWagmiConfig {
  if (cachedConfig !== undefined) return cachedConfig;

  if (!isWalletConfigured() || !robinhoodChain) {
    cachedConfig = null;
    return null;
  }

  const primaryChainId = robinhoodChain.id;
  const chains = bridgeWalletChains() ?? ([robinhoodChain] as const);

  cachedConfig = createConfig({
    chains,
    transports: Object.fromEntries(
      chains.map((chain) => [
        chain.id,
        // Robinhood Chain keeps its own configured RPC URL. Every other
        // bridge source chain uses a live-verified PublicNode endpoint
        // (BRIDGE_CHAIN_RPC_URLS) as primary — viem's single bundled
        // default proved unreliable for mainnet balance reads — with
        // viem's bundled default kept as a fallback if PublicNode is ever
        // down.
        chain.id === primaryChainId
          ? http(projectConfig.wallet.rpcUrl)
          : fallback([http(BRIDGE_CHAIN_RPC_URLS[chain.id]), http()]),
      ]),
    ),
    ssr: true,
  });

  return cachedConfig;
}
