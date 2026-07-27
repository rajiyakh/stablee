import type { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { getWagmiConfig } from "@/config/wagmi";
import { privyLoginConfig } from "@/config/privy";
import { projectConfig } from "@/config/project";

/**
 * Split into its own dynamically-imported chunk (see __root.tsx) so the
 * Privy SDK and its bundled connector ecosystem (WalletConnect, Reown,
 * Coinbase) never reach a visitor's browser unless wallet connect is
 * actually enabled — otherwise every route pays for a feature most
 * deployments have off.
 */
export default function WalletProviders({ children }: { children: ReactNode }) {
  const wagmiConfig = getWagmiConfig();
  if (!wagmiConfig) return <>{children}</>;

  return (
    <PrivyProvider appId={projectConfig.wallet.privyAppId} config={privyLoginConfig}>
      <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
    </PrivyProvider>
  );
}
