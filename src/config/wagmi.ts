import { createConfig, http, type Config } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { robinhoodChain } from "./robinhoodChain";
import { projectConfig, isWalletConfigured } from "./project";

let cachedConfig: Config | null | undefined;

/**
 * Lazily builds the wagmi config so a missing WalletConnect project ID or
 * unconfigured chain never throws at module-import time — that would break
 * every route, not just /swap, since __root.tsx is shared. Returns null
 * (never a half-valid config) when isWalletConfigured() is false.
 */
export function getWagmiConfig(): Config | null {
  if (cachedConfig !== undefined) return cachedConfig;

  if (!isWalletConfigured() || !robinhoodChain) {
    cachedConfig = null;
    return null;
  }

  cachedConfig = createConfig({
    chains: [robinhoodChain],
    connectors: [
      injected(),
      walletConnect({ projectId: projectConfig.wallet.walletConnectProjectId }),
    ],
    transports: {
      [robinhoodChain.id]: http(projectConfig.wallet.rpcUrl),
    },
    ssr: true,
  });

  return cachedConfig;
}
