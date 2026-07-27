import { http } from "wagmi";
import { createConfig } from "@privy-io/wagmi";
import { robinhoodChain } from "./robinhoodChain";
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
 */
export function getWagmiConfig(): PrivyWagmiConfig {
  if (cachedConfig !== undefined) return cachedConfig;

  if (!isWalletConfigured() || !robinhoodChain) {
    cachedConfig = null;
    return null;
  }

  cachedConfig = createConfig({
    chains: [robinhoodChain],
    transports: {
      [robinhoodChain.id]: http(projectConfig.wallet.rpcUrl),
    },
    ssr: true,
  });

  return cachedConfig;
}
