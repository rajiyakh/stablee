# The Buy button

## What it does

Every "Buy" CTA in the app (Markets tables, Trending, Hot Searches, the token detail drawer,
the on-chain token detail page, Watchlist, AI Feed) is the same shared component:
`src/components/market/BuySwapButton.tsx`. It is a plain internal navigation — a TanStack
Router `Link to="/swap" search={{ buy: address }}` — to this app's own swap page
(`src/routes/swap.index.tsx` / `src/features/swap/SwapPage.tsx`), with that token
pre-selected as the buy side. It never opens an external site, never shows a "leaving this
site" warning (there is nothing to warn about), and never executes a transaction on click —
`/swap` still requires the user to enter an amount, review a real quote, and explicitly
confirm before anything is signed.

`BuySwapButton` renders nothing for a token that isn't on Robinhood Chain (checked against
`projectConfig.dataSources.robinhoodDexScreenerChainId`, the same "robinhood" chain
identifier used consistently across `DexMarket.chainId`, `TokenRef.chainId`,
`WatchEntry.chainId`, and GMGN's `chain` field) — this app can only swap Robinhood Mainnet
tokens, so a Buy button is never shown for a token it can't actually route into `/swap`.

## History

This replaced an earlier design (`src/config/tradingDestinations.ts`,
`ExternalBuyButton.tsx`, `ExternalTradeConfirmation.tsx` — all removed) that resolved a
whitelisted external URL (GMGN's own token page, or Uniswap's Robinhood Chain swap URL) and
showed a "Leaving RobinPulse AI" confirmation before opening it in a new tab. That design's
priority ordering meant GMGN's own trading page was resolved for every token — Uniswap was
unreachable dead code. The explicit product decision was to never send a user to GMGN's (or
any other) external DEX at all, and instead route every Buy click through this app's own
audited swap infrastructure. See `docs/0X_SWAP_SETUP.md` / `docs/SWAP_SECURITY.md` for how
`/swap` itself works.

## `/swap`'s deep-link contract

`swap.index.tsx` validates two optional search params, `buy` and `sell` (each a bare EVM
address, malformed values silently ignored via `.catch(undefined)` rather than erroring the
route). `SwapPage` resolves whichever are present through the exact same mechanism
`TokenSelect`'s paste-address flow already uses — `resolveSwapToken()`
(`src/lib/swap/discoverTokens.server.ts`, curated list → GMGN-discovered → direct on-chain
`decimals()`/`symbol()`/`name()` lookup) via `GET /api/swap/resolve-token` — never trusting a
caller-supplied symbol or decimals for the deep-linked token. If the resolved `buy` token
would collide with the default `sell` side (e.g. deep-linking to buy WETH, itself one of the
two swap defaults), `sell` falls back to the other default instead of leaving both sides
identical.
