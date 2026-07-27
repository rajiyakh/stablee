# Wallet Setup

There is currently **no wallet-connect UI anywhere in the app**, and no wagmi/viem/WalletConnect dependency is installed. This document explains the current readiness state and the path to actually building it later — nothing here should be read as "wallet connect exists but is hidden."

## Current state

`src/config/project.ts`'s `wallet` block:

```ts
wallet: {
  enabled: false,
  chainName: read("VITE_ROBINHOOD_CHAIN_NAME") || "Robinhood Mainnet",
  chainId: Number(read("VITE_ROBINHOOD_CHAIN_ID")) || null,
  rpcUrl: read("VITE_ROBINHOOD_RPC_URL"),
  explorerUrl: read("VITE_ROBINHOOD_EXPLORER_URL"),
  nativeCurrencyName: read("VITE_ROBINHOOD_NATIVE_CURRENCY_NAME"),
  nativeCurrencySymbol: read("VITE_ROBINHOOD_NATIVE_CURRENCY_SYMBOL"),
  walletConnectProjectId: read("VITE_WALLETCONNECT_PROJECT_ID"),
},
```

The chain facts (`chainId`, `chainName`, `rpcUrl`, `explorerUrl`, native currency) are now correctly wired from real, public, non-secret env vars (see docs/ADDING_ROBINHOOD_NETWORK.md) — these are public blockchain facts, safe to expose client-side. `enabled` is hardcoded `false` and `walletConnectProjectId` is empty, so `isWalletConfigured()` returns `false` and will continue to until a real WalletConnect Cloud project ID is supplied. No UI currently reads `isWalletConfigured()` at all.

## To actually build wallet-connect later

1. `npm install wagmi viem @tanstack/react-query` (react-query is already installed) and a connector package (e.g. `@walletconnect/ethereum-provider` or use wagmi's built-in WalletConnect connector).
2. Get a WalletConnect Cloud project ID and set `VITE_WALLETCONNECT_PROJECT_ID`.
3. Define the Robinhood Chain as a wagmi `Chain` object using `projectConfig.wallet.{chainId,chainName,rpcUrl,explorerUrl,nativeCurrencyName,nativeCurrencySymbol}` — every field needed is already computed and available, don't hardcode a second copy.
4. Wrap the app in a `WagmiProvider` inside `src/routes/__root.tsx`'s `RootComponent`, gated by `isWalletConfigured()` — if it returns `false`, render nothing extra (no provider, no connect button).
5. Flip `wallet.enabled` to read from an env var (or simply `true`) once the above is wired and tested.
6. Build the connect UI last, and make sure every state (connecting, connected, wrong network, disconnected) is real — never render a fake "Connected: 0x..." address.

## Until then

If a "Connect Wallet" affordance is ever added anywhere, gate it as:

```tsx
{
  isWalletConfigured() ? <ConnectWalletButton /> : <span>Wallet integration coming soon.</span>;
}
```
