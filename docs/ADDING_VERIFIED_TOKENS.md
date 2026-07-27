# Adding Verified Tokens

`src/config/verifiedTokens.ts` exports `verifiedTokens: VerifiedTokenConfig[]`, an owner-curated allowlist merged into Robinhood Mainnet (or any other chain's) token discovery. It is supplementary, not required — DEX Screener's own boost/profile feeds already auto-discover Robinhood Chain tokens once `VITE_ROBINHOOD_DEXSCREENER_CHAIN_ID` is set (see docs/ADDING_ROBINHOOD_NETWORK.md). Use this file only for tokens you specifically want to guarantee inclusion for, or want to badge as owner-verified.

## Entry shape

```ts
export interface VerifiedTokenConfig {
  chainId: string; // must match a real provider chain slug, e.g. "robinhood"
  address: string; // the real on-chain contract address
  symbol?: string;
  name?: string;
  logoUrl?: string;
  websiteUrl?: string;
  xUrl?: string;
  telegramUrl?: string;
  verifiedByOwner: boolean; // must be true to be included
}
```

## Rules

- Never add a sample/placeholder token. Only add an address you have personally verified on-chain (via the chain's block explorer).
- `chainId` is matched case-insensitively against the chain identifier used elsewhere in the app (currently `robinhood` for Robinhood Mainnet).
- `verifiedTokensForChain(chainId)` filters this list and is called from `/api/market/dexscreener/trending/$chainId` — entries here are merged into the discovered candidate set before scoring, they don't bypass the trend-score/risk-flag pipeline.

## Current state

Empty. RobinPulse AI does not maintain any owner-verified Robinhood Chain contract addresses at this time — populate this file once the owner has audited specific addresses.
