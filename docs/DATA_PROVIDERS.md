# Data Providers

RobinPulse AI proxies three third-party market-data providers through its own `/api/market/**` server routes. The browser never calls a provider directly and never sees a provider API key.

## CoinGecko

- Module: `src/lib/market/coingecko.server.ts`
- Endpoints proxied: global trending, coin markets list, coin detail, price chart, search
- Auth: optional (`COINGECKO_API_KEY`, sent as `x-cg-demo-api-key`/`x-cg-pro-api-key`). The free tier works unauthenticated, just rate-limited.
- Always reported as "configured" — there is no unconfigured state for CoinGecko.

## DEX Screener

- Module: `src/lib/market/dexscreener.server.ts`
- Endpoints proxied: pair/token search, token pairs, chain-scoped trending discovery (via the `token-profiles`/`token-boosts` feeds filtered by `chainId`)
- Auth: none required
- Robinhood Mainnet tokens only appear when a result's `chainId` exactly matches `VITE_ROBINHOOD_DEXSCREENER_CHAIN_ID`, or the token is in `verifiedTokens.ts`. A token from another chain is never substituted in.

## GeckoTerminal

- Module: `src/lib/market/geckoterminal.server.ts`
- Endpoints proxied: networks list, pools, token pools, trending pools
- Auth: none required
- Gated entirely by `GECKOTERMINAL_ROBINHOOD_NETWORK_ID` — `geckoTerminalConfigured()` returns `false` and every GeckoTerminal route responds with `not_configured` (HTTP 200, `error.code: "not_configured"`) when it's empty.

## Shared plumbing (`src/lib/market/http.server.ts`)

- In-memory response cache (max 400 entries) with per-endpoint TTLs from `src/config/trending.ts`'s `cacheConfig`.
- Retry with exponential backoff (2 retries, `300ms * 2^attempt`) and a 9s request timeout via `AbortController`.
- Stale-while-revalidate: on total upstream failure, the last cached value is served with `stale: true` rather than an error, when one exists.
- Per-provider runtime status tracking, surfaced on `/data` and via `/api/market/status`.
- A fixed-window in-memory rate limiter (`rateLimit`) backs `guard()`, applied to every `/api/market/**` route: 90 requests/60s per IP/bucket. This is in-memory only — it resets on redeploy and does not share state across multiple server instances/regions; see docs/SECURITY_REVIEW.md.

## Response validation

Every provider response is parsed through a Zod schema (`coinSchema`, `pairSchema`, `poolSchema`, etc.) before any field is used — malformed or unexpected upstream shapes raise `z.ZodError`, which `jsonError()` converts to a generic `invalid_provider_response` message. No raw upstream error text, stack trace, or internal URL is ever included in a response sent to the browser.

## Attribution and timestamps

Every API response envelope (`ApiEnvelope<T>`) carries `provider`, `attribution`, `fetchedAt`, `stale`, and `cached`. Every page that renders provider data shows a `DataSourceNote` with the provider name and a relative "updated Xm ago" / stale indicator — never a silent, unattributed number.

## Unsupported-network behavior

If a chain/network identifier isn't recognized by a provider, that provider simply returns zero results for it — the UI shows the existing "no markets returned" empty state, not an error. Nothing is invented to fill the gap.
