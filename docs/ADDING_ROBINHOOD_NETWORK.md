# Adding / Verifying the Robinhood Network Configuration

Robinhood Mainnet ("Robinhood Chain") is a real Arbitrum Orbit L2 that settles to Ethereum, launched 2026-07-01. This app currently ships with it configured as follows — re-verify these values live if the chain is ever re-deployed or a provider changes its slug.

## Current values (`.env`)

| Variable                                                 | Value                                     | How to re-verify                                                                                                                                    |
| -------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ROBINHOOD_CHAIN_ID` / `VITE_ROBINHOOD_CHAIN_ID`         | `4663`                                    | Robinhood's own docs: `https://docs.robinhood.com/chain/connecting`                                                                                 |
| `ROBINHOOD_CHAIN_NAME` / `VITE_ROBINHOOD_CHAIN_NAME`     | `Robinhood Chain`                         | —                                                                                                                                                   |
| `ROBINHOOD_RPC_URL` / `VITE_ROBINHOOD_RPC_URL`           | `https://rpc.mainnet.chain.robinhood.com` | Same docs page; this is the free public endpoint — rate limited, use a dedicated RPC provider (Alchemy/QuickNode/Chainstack) for production traffic |
| `ROBINHOOD_EXPLORER_URL` / `VITE_ROBINHOOD_EXPLORER_URL` | `https://robinhoodchain.blockscout.com`   | Blockscout explorer                                                                                                                                 |
| `ROBINHOOD_NATIVE_CURRENCY_NAME` / `SYMBOL`              | `Ether` / `ETH`                           | Chain uses ETH for gas                                                                                                                              |
| `VITE_ROBINHOOD_DEXSCREENER_CHAIN_ID`                    | `robinhood`                               | Confirm live: `curl https://api.dexscreener.com/token-boosts/latest/v1` and check for `"chainId":"robinhood"` entries                               |
| `GECKOTERMINAL_ROBINHOOD_NETWORK_ID`                     | `robinhood`                               | Confirm live: `curl https://api.geckoterminal.com/api/v2/networks` and look for `{"id":"robinhood", ...}`                                           |

## What each variable actually controls

- `VITE_ROBINHOOD_DEXSCREENER_CHAIN_ID` is read by `src/routes/trending.tsx` and `/api/market/dexscreener/trending/$chainId` — this is what makes the "Robinhood Trends" nav item / Robinhood Mainnet tab return real on-chain markets instead of the "not configured" empty state.
- `GECKOTERMINAL_ROBINHOOD_NETWORK_ID` gates every GeckoTerminal route (`geckoTerminalConfigured()`); GeckoTerminal is optional/supplementary — DEX Screener alone already powers Robinhood Mainnet discovery.
- The `ROBINHOOD_CHAIN_ID`/`VITE_ROBINHOOD_CHAIN_ID` pair feeds `/api/market/status` (provider status card) and `src/config/project.ts`'s `wallet` block respectively — see docs/WALLET_SETUP.md.

## Important

Server-only variables (no `VITE_` prefix) only take effect after a server restart — Vite inlines `VITE_*` client vars at build time, but `process.env.*` reads happen at server startup. If you change `GECKOTERMINAL_ROBINHOOD_NETWORK_ID` or any `ROBINHOOD_*` var, restart the dev/build process.

Because Robinhood Chain is very new, DEX Screener's discovery feed for it may return few results at any given time — that reflects real, thin on-chain liquidity, not a misconfiguration.
