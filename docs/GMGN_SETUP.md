# GMGN Setup — Robinhood Mainnet Trending & Hot Searches

## What this powers

`/markets/trending` and `/markets/hot-searches` — the only two market functions on this
site backed by GMGN. Both show Robinhood Mainnet tokens only (`chain=robinhood`); GMGN's
other supported chains (`sol`, `bsc`, `base`, `eth`) are never requested or shown here.

- **Trending** ranks tokens by GMGN's market/swap-activity ranking (`market trending`).
- **Hot Searches** ranks tokens by GMGN's search-attention ranking (`market hot-searches`).

Both support intervals `1m`, `5m`, `1h`, `6h`, `24h` — exactly what GMGN's CLI accepts, no
more, no less. An unsupported interval is rejected (`400 invalid_params`), never silently
substituted for a different one.

## Getting an API key

GMGN market data requires a key from GMGN (`GMGNAI/gmgn-skills` on GitHub is the official
integration this app is built against). Obtain a key through GMGN's own channel, then set:

```
GMGN_API_KEY=your-key-here
```

in `.env` (local dev) or the hosting platform's environment variable settings
(production — see docs/DEPLOYMENT.md for how this project sets Vercel env vars).

**Never** put this key in a `VITE_`-prefixed variable. `VITE_` variables are bundled into
the client JavaScript and shipped to every visitor's browser — a private API key in one is
equivalent to publishing it. This project's build was checked (`grep -r GMGN_API_KEY
.vercel/output/static`) to confirm the key never appears in client-served files.

## Why every GMGN request goes through the server

All GMGN traffic is initiated from `src/providers/gmgn/client.server.ts`, a `.server.ts`
file — this repo's ESLint config (`no-restricted-imports` against the `server-only`
package) fails the build if a `.server.ts` module is ever imported from client code. That
file spawns the official `gmgn-cli` npm package via `child_process.execFile`, with
`GMGN_API_KEY` injected only into the child process's environment. The browser never sees
the key, never talks to GMGN directly, and never receives a raw GMGN response — only the
normalized, validated `RobinhoodTrendingToken[]` / `RobinhoodHotSearchToken[]` shape defined
in `src/types/gmgn.ts`.

Route handlers (`src/routes/api/market/gmgn/trending.ts`, `.../hot-searches.ts`) sit between
the client and `client.server.ts`, and are the only way the browser reaches GMGN data:

```
Browser → /api/market/gmgn/trending?interval=1h&limit=100
        → guard() rate limit
        → notConfigured() if GMGN_API_KEY unset
        → client.server.ts (spawns gmgn-cli, GMGN_API_KEY only in child env)
        → gmgnTrendingResponseSchema.parse() (Zod — rejects malformed shapes)
        → normalizeTrending() (interval-scoped field mapping, chain/address filter)
        → jsonOk(envelope("gmgn", ...))
```

This project does not scrape gmgn.ai's website HTML anywhere — only the official CLI/API
integration is used, per this project's standing security rule against unauthorized
scraping.

## Robinhood chain identifier

GMGN's chain parameter for Robinhood Mainnet is the literal string `"robinhood"`
(`GmgnChain` in `src/types/gmgn.ts`). This is passed explicitly on every request — the CLI
is never called without `--chain robinhood`, and `normalize.ts` additionally filters out
any response item that isn't `chain === "robinhood"` with a valid EVM address, as a second
layer of defense against a malformed or unexpected provider response leaking a different
chain's token into a Robinhood-only page.

## Caching, staleness, and rate limits

- Successful responses are cached in-memory per `(endpoint, chain, interval, limit)` key for
  45 seconds (`src/providers/gmgn/client.server.ts`). A request within that window is served
  from cache instantly, marked `cached: true`.
- On a GMGN failure (rate limit, timeout, provider error), if a cache entry exists — even an
  expired one — it is served instead of failing outright, marked `stale: true`. The UI shows
  a "Delayed" badge and the real last-successful-fetch timestamp in this case; it never
  fabricates fresher data.
- On a failure with **no** cache at all (e.g. the very first request during an outage), the
  route returns the appropriate error and the page shows one of the required empty states
  (see below) — it never falls back to CoinGecko or any other chain's data.
- GMGN's own rate limit is a leaky bucket (`rate=20 capacity=20` per the CLI's published
  docs). This client does not aggressively retry on a 429 — only transient errors (timeout,
  generic provider error) get a single retry; a rate-limit or auth failure is surfaced
  immediately so the cached-data fallback above can take over instead of making the
  situation worse. On the client, TanStack Query is likewise configured
  (`src/lib/market/client.ts`, `gmgnRetry`) to never retry a `not_configured` response, since
  retrying can't fix a missing key.
- **Known limitation**: because this project calls the GMGN CLI rather than raw HTTP, it
  cannot read the `X-RateLimit-Reset` response header GMGN documents — the CLI does not
  currently surface it. Rate-limit backoff here is therefore time-based (single retry, short
  delay), not header-driven. If GMGN's CLI adds a way to surface that header, wiring it in
  is a small change scoped entirely to `client.server.ts`.

## Empty and error states (exact copy, do not change without updating the spec)

| Condition | Copy |
|---|---|
| No `GMGN_API_KEY` configured | "GMGN market data is not configured. Add a valid GMGN API key to enable Robinhood Mainnet Trending and Hot Searches." |
| Configured but zero rows returned | "No Robinhood Mainnet tokens were returned for this interval." |
| Rate limited, no cache available | "GMGN is temporarily rate-limiting requests. Cached data will remain visible where available." |
| Any other provider failure, no cache available | "Robinhood Mainnet market data is temporarily unavailable." |
| Stale (cache served after a failure) | "Delayed" badge + real last-successful-fetch timestamp via `DataSourceNote` |

## Testing without a real key

With `GMGN_API_KEY` unset, `/markets/trending` and `/markets/hot-searches` show the
"not configured" state above — this is the default, safe behavior and was verified with a
Playwright smoke test against the local dev server during this integration. Provider health
also appears in the existing site-wide status bar (`/api/market/status`) as a `"gmgn"`
entry alongside CoinGecko/DEX Screener/GeckoTerminal.

**Live-data behavior was not exercised against a real key in this session** — no key was
available. The request/normalize/cache/error pipeline is built and reviewed against GMGN's
confirmed real CLI flags and field names (see the implementation plan for the verification
trail), but actual token rows, real rate-limit responses, and real stale-cache fallback have
not been observed end-to-end. Once a key is set, re-run the manual checks in the
implementation plan's Verification section against real data before treating this as fully
proven in production.
