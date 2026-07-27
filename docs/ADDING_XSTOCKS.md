# Adding xStocks

The verified xStock registry lives at `src/config/xstocks.ts`, exported as `xStockRegistry: XStockRegistryItem[]`. Only entries in this array are ever shown on `/xstocks` or get a TradingView chart on their `/coin/$coinId` page — nothing is inferred from a ticker or token name.

## Entry shape

```ts
export interface XStockRegistryItem {
  symbol: string; // e.g. "AAPLx"
  name: string; // e.g. "Apple xStock"
  coinGeckoId?: string; // e.g. "apple-xstock" — required for live price data
  platformId?: string;
  contractAddress?: string;
  underlyingTicker?: string; // e.g. "AAPL" — real stock ticker, drives the TradingView chart
  issuerUrl?: string;
  documentationUrl?: string;
  verified: boolean; // must be true to display
}
```

## How to verify a `coinGeckoId` before adding it

Never guess a CoinGecko id. Confirm it resolves to a real record first:

```bash
curl "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=xstocks-ecosystem&per_page=250"
```

CoinGecko maintains an `xstocks-ecosystem` category covering the Backed Finance xStocks product — cross-check the `id`/`symbol`/`name` you intend to add against that response before committing it.

## Current registry

30 curated, high-liquidity names (Apple, Tesla, NVIDIA, Alphabet, Amazon, Microsoft, Meta, SPY, QQQ, MicroStrategy, Coinbase, Robinhood, Circle, Netflix, Palantir, Broadcom, Oracle, AMD, Intel, Berkshire Hathaway, JPMorgan Chase, Goldman Sachs, Visa, Mastercard, Walmart, Uber, GameStop, MARA, Riot Platforms, Gold) — a subset of the ~109 tokens CoinGecko currently tracks under `xstocks-ecosystem`. To add more, follow the same verification step above and append an entry with `verified: true`.

## What happens automatically once an entry exists

- `/xstocks` fetches live price/market data for every entry with a `coinGeckoId` via `coinsQuery()` and renders it in the same `CoinTable` used on `/markets`.
- `/coin/$coinId` looks up the current coin against the registry by `coinGeckoId`; if `underlyingTicker` is set, a TradingView Advanced Chart widget renders below the price-history chart using that ticker.
- If `xStockRegistry` is empty, `/xstocks` shows: "No verified xStock assets have been configured yet."
