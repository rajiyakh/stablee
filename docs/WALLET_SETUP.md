# Wallet Setup

Wallet connect is built and wired end-to-end (Privy + wagmi, powering `/swap`), but is **off in production** until the owner supplies a Privy App ID and flips `VITE_WALLET_ENABLED=true`. Until then, `/swap` shows a "not yet available" empty state and no wallet code ships to the browser at all (see Bundle impact below).

## Provider: Privy

`@privy-io/react-auth` + `@privy-io/wagmi` — not raw wagmi connectors, not a bare WalletConnect Cloud integration. Privy drives wagmi's connector state internally; app code still uses plain wagmi hooks (`useAccount`, `useWriteContract`, `useSendTransaction`, `useReadContract`) for reading chain state and sending transactions, and Privy's `usePrivy()` hook (`connectWallet()` / `logout()`) for the connect/disconnect UI.

## Current state

`src/config/project.ts`'s `wallet` block:

```ts
wallet: {
  enabled: read("VITE_WALLET_ENABLED") === "true",
  chainName: read("VITE_ROBINHOOD_CHAIN_NAME") || "Robinhood Mainnet",
  chainId: Number(read("VITE_ROBINHOOD_CHAIN_ID")) || null,
  rpcUrl: read("VITE_ROBINHOOD_RPC_URL"),
  explorerUrl: read("VITE_ROBINHOOD_EXPLORER_URL"),
  nativeCurrencyName: read("VITE_ROBINHOOD_NATIVE_CURRENCY_NAME"),
  nativeCurrencySymbol: read("VITE_ROBINHOOD_NATIVE_CURRENCY_SYMBOL"),
  walletConnectProjectId: read("VITE_WALLETCONNECT_PROJECT_ID"),
  privyAppId: read("VITE_PRIVY_APP_ID"),
},
```

`isWalletConfigured()` requires every chain fact plus `privyAppId`. `walletConnectProjectId` is **not** required — Privy provides its own WalletConnect relay by default; the env var only matters if you want to point Privy at a self-hosted/custom WalletConnect Cloud project (set it in the Privy Dashboard, not via app code).

## To go live

1. Create a Privy app at [dashboard.privy.io](https://dashboard.privy.io) and copy the App ID.
2. Set `VITE_PRIVY_APP_ID` (local `.env` and the Vercel project's env vars — this is a public client ID, safe to expose, not a secret).
3. Set `VITE_WALLET_ENABLED=true`.
4. Redeploy. `isWalletConfigured()` flips true, `/swap` renders the real swap UI, and the wallet-provider chunk becomes reachable.
5. CSP: `vite.config.ts`'s `securityHeaders` already allowlists Privy/WalletConnect origins (`auth.privy.io`, `*.rpc.privy.systems`, WalletConnect relay/verify/explorer hosts, `challenges.cloudflare.com`) per Privy's own CSP guide — but verify against a real `VITE_WALLET_ENABLED=true` preview deploy anyway, the same way the TradingView/DexScreener `frame-src` entries were confirmed empirically (see `docs/SECURITY_REVIEW.md`). A CSP violation fails closed with no obvious error, so this is easy to miss.
6. Run `npm audit --production --audit-level=high` before flipping the flag. As of this integration, Privy's bundled WalletConnect/Coinbase connector deps pull in known-vulnerable transitive packages (`ws` DoS, `axios` proxy/info-exposure — both only reachable once those connector code paths actually execute, i.e. once wallet connect is live). Check for upstream Privy/Reown patches rather than downgrading `@privy-io/react-auth` (the only `npm audit fix` path is a semver-major downgrade).

## Architecture notes

- `src/config/privy.ts` — `PrivyClientConfig`. `loginMethods: ["wallet"]` only (no email/SMS — this app never wants a Privy-managed custodial embedded wallet). `embeddedWallets.ethereum.createOnLogin: "off"` enforces that explicitly. `defaultChain`/`supportedChains` come from `robinhoodChain` (the client wallet-gated chain object), never a second hardcoded copy.
- `src/config/wagmi.ts` — builds the wagmi `Config` via `@privy-io/wagmi`'s `createConfig` (not wagmi's own) with **no `connectors` array** — Privy injects connectors itself; passing a manual list would fight it. Returns `null` (never half-valid) when `isWalletConfigured()` is false.
- `src/components/wallet/WalletProviders.tsx` — the actual `PrivyProvider > WagmiProvider` composition, dynamically imported (see Bundle impact).
- `src/routes/__root.tsx` — lazy-loads `WalletProviders` behind `React.lazy` + `Suspense`, gated on `isWalletConfigured()`.
- `src/routes/swap.index.tsx` — `SwapPage` is also `React.lazy`-loaded, independently of the root provider split.

## Bundle impact

Privy's SDK (plus its bundled WalletConnect/Reown/Coinbase connector code) is large — on the order of 150-200kb gzipped. Both entry points above are dynamically imported specifically so this cost is **never paid by a visitor who doesn't touch `/swap`**, and isn't paid at all while `VITE_WALLET_ENABLED` is unset. Verified empirically (Playwright network capture against a real production-preset build): loading `/` and loading `/swap` with wallet disabled both show zero Privy/wagmi/WalletConnect requests.

If you ever add another static top-level `import ... from "@privy-io/..."` anywhere outside `WalletProviders.tsx` or behind a `React.lazy()` boundary, re-run that same check — this repo's router does not auto-code-split route components, so `routeTree.gen.ts`'s static imports will pull anything imported eagerly from a route file into the shared bundle for every page.
