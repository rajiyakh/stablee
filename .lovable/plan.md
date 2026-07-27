## RobinPulse AI — build plan

A public market intelligence dashboard over real provider data (CoinGecko, DEX Screener, optional GeckoTerminal), with AI-agent architecture that starts empty rather than faked.

### One stack correction

The project runs on TanStack Start / TanStack Router (not React Router), and server logic uses TanStack server routes rather than Supabase Edge Functions. I'll keep everything else as specified: React, TypeScript, Tailwind, shadcn/ui, TanStack Query, Recharts, Zod. API keys stay server-side in route handlers.

### Configuration layer (all values empty, owner fills later)

- `src/config/project.ts` — branding, links, socials, contact, wallet, dataSources (exact shape from the brief; reads `import.meta.env.VITE_*` with empty-string defaults).
- `src/config/xstocks.ts` — `XStockRegistryItem[]`, empty.
- `src/config/verifiedTokens.ts` — `VerifiedTokenConfig[]`, empty.
- `src/config/trending.ts` — weights, thresholds (min liquidity, min pair age, min tx count), risk-flag rules, min scored calls (10), scoring weights.
- `.env.example` — exactly the listed keys, all blank.

### Server routes (`src/routes/api/market/...`)

Thin Zod-validated proxies with timeout, retry+backoff, in-memory TTL cache (price 45s, trending 3m, metadata 45m, chart 10m, status 10m), normalized envelope `{ data, provider, fetchedAt, stale, error }`.

- CoinGecko: `trending`, `search`, `coins`, `coin/$id`, `chart/$id`
- DEX Screener: `search`, `pairs`, `token/$chainId/$address`, `trending/$chainId`
- GeckoTerminal: `networks`, `pools/$networkId`, `token/$networkId/$address`, `trending/$networkId` — disabled unless network ID configured
- `status` — per-provider live/delayed/unavailable/not-configured plus last success/failure

Robinhood section only accepts rows whose chain equals the configured Robinhood chain ID or that appear in the verified-token registry; otherwise the honest configuration empty state. Global CoinGecko trending never feeds it.

### Trending score

Normalized components (volume acceleration, tx activity, liquidity, momentum, buy pressure, consistency) with configurable weights; suppressed when inputs are missing. Boost data shown separately as promotional. Risk labels: limited data, low liquidity, high volatility, new pair, buy/sell imbalance, promotional boost, verification unavailable. Dedup pairs; optional stablecoin/wrapped exclusion.

### Design system

Light premium fintech theme in `src/styles.css` as semantic oklch tokens from the given palette (bg #F5F6F0, card #FFFFFF, surface #EEF1E8, text #14251C/#627067, green #1F7A4D, accent #C8F135, border #DDE3D8, positive/negative/warning). Editorial type pairing loaded via `<link>` in `__root.tsx`. No dark theme, no neon.

### Routes

`/`, `/feed`, `/markets`, `/markets/xstocks`, `/markets/robinhood`, `/markets/global-trends`, `/markets/$source/$identifier`, `/agents`, `/agents/$slug`, `/leaderboard`, `/watchlist`, `/calls/$id`, `/methodology`, `/data-sources`, `/settings`. Each gets its own `head()` metadata. Sticky responsive nav + live-data indicator + disabled wallet button with tooltip; footer with disclaimer, attribution, and socials hidden while empty.

Homepage is a working dashboard: required heading/subline, CTA pair, provider status bar, Robinhood Mainnet Trending, Verified xStocks, Global Crypto Trends, Recent AI Analysis.

Markets: tabbed, table/card views, search, sort, filters (mobile bottom sheet), refresh, timestamps; missing values sort distinctly from zero. Detail page shows full provider fields, copy-contract, watchlist, risk flags, OHLCV chart only when data exists.

### AI layer (real-data, no fabrication)

Eight agent profiles (Vector, Meridian, Revert, FlowState, Ledger, Echo, Atlas, Parallax) with static methodology and zeroed/"Not enough data" stats. Feed shows deterministic "Automated market summary" cards derived from live metrics only, plus threshold-derived alerts; empty-call notice above them. `MarketCall` types and call/leaderboard/scoring UI built against an empty store, ready for a backend.

### Client state

localStorage-backed watchlist, followed agents, bookmarks — storing identifiers only, re-fetching live values on open.

### Cross-cutting

Error boundaries, retry buttons, all listed loading/empty/error states, accessibility (semantic HTML, focus rings, labels, reduced motion, chart text summaries), responsive layouts.

### Docs

`README.md` plus `docs/DATA_PROVIDERS.md`, `ADDING_XSTOCKS.md`, `ADDING_ROBINHOOD_NETWORK.md`, `ADDING_VERIFIED_TOKENS.md`, `WALLET_SETUP.md`, `AI_AGENT_BACKEND.md`, `SCORING_ENGINE.md`, `DEPLOYMENT.md` — each naming the exact file/env var the owner edits.

### Verification before finishing

Typecheck, load every route headless, check console errors, exercise provider-failure and empty-response paths, confirm no fabricated tokens/prices, empty wallet + social config, and no keys in the client bundle.

### Note on scope

Wallet libraries (wagmi/viem/WalletConnect) will be wired as an isolated, disabled module — installed but never activated without real chain config, so nothing guesses Robinhood Mainnet values.
