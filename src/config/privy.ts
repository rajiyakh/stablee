import type { PrivyClientConfig } from "@privy-io/react-auth";
import { robinhoodChain } from "./robinhoodChain";
import { bridgeWalletChains } from "./bridgeChains";

/**
 * Login methods kept intentionally narrow to "wallet" only. Email/SMS login
 * would create Privy-managed embedded wallets — out of scope for a swap
 * surface where every position must be self-custodied from the start.
 */
export const privyLoginConfig: PrivyClientConfig = {
  loginMethods: ["wallet"],
  appearance: {
    walletChainType: "ethereum-only",
    showWalletLoginFirst: true,
  },
  embeddedWallets: {
    ethereum: { createOnLogin: "off" },
  },
  ...(robinhoodChain
    ? {
        // defaultChain stays Robinhood Chain regardless of the bridge feature
        // — opening any wallet-gated page still lands on the primary chain;
        // only an explicit bridge source-chain selection triggers a switch.
        defaultChain: robinhoodChain,
        supportedChains: [...(bridgeWalletChains() ?? [robinhoodChain])],
      }
    : {}),
};
