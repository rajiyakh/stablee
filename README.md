# RobinPulse AI

Public market-intelligence dashboard for tokenized equities (xStocks) and Robinhood Mainnet on-chain tokens. Every number on the site comes from a live, attributed third-party provider (CoinGecko, DEX Screener, GeckoTerminal) or an owner-maintained verified registry — nothing is simulated, estimated, or fabricated. Where a provider cannot supply a value, the UI shows an empty/unavailable state instead of a placeholder number.

## Stack

TanStack Start (SSR) + TanStack Router + TanStack Query, React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Zod. Runs on Bun or Node/npm.

## Getting started

```bash
npm install        # or: bun install
cp .env.example .env
npm run dev         # or: bun run dev
```

The app works out of the box on CoinGecko's free tier — no API key required. See [docs/PROJECT_CONFIGURATION.md](docs/PROJECT_CONFIGURATION.md) for every environment variable and what it unlocks.

## Scripts

| Script            | Purpose                      |
| ----------------- | ---------------------------- |
| `npm run dev`     | Start the dev server         |
| `npm run build`   | Production build             |
| `npm run preview` | Preview the production build |
| `npm run lint`    | ESLint                       |
| `npm run format`  | Prettier write               |

## Documentation

- [docs/PROJECT_CONFIGURATION.md](docs/PROJECT_CONFIGURATION.md) — every env var
- [docs/DATA_PROVIDERS.md](docs/DATA_PROVIDERS.md) — CoinGecko / DEX Screener / GeckoTerminal integration
- [docs/ADDING_XSTOCKS.md](docs/ADDING_XSTOCKS.md) — extending the xStock registry
- [docs/ADDING_ROBINHOOD_NETWORK.md](docs/ADDING_ROBINHOOD_NETWORK.md) — Robinhood Mainnet chain config
- [docs/ADDING_VERIFIED_TOKENS.md](docs/ADDING_VERIFIED_TOKENS.md) — owner-verified token allowlist
- [docs/WALLET_SETUP.md](docs/WALLET_SETUP.md) — wallet-connect readiness (currently disabled)
- [docs/TOKEN_PAGE_SETUP.md](docs/TOKEN_PAGE_SETUP.md) — the `/token` announcement page
- [docs/AI_AGENT_BACKEND.md](docs/AI_AGENT_BACKEND.md) — agent profiles and the future scoring backend
- [docs/SCORING_ENGINE.md](docs/SCORING_ENGINE.md) — the trend-score algorithm
- [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md) — internal security audit record
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — build and deploy

## Principles

- Real data only. No fictional tokens, fake prices, fake volume, fake liquidity, or fabricated AI performance.
- Missing data renders as an empty/unavailable state — never a zero or a guess.
- The protocol token has not launched. `/token` is an announcement page only, driven entirely by `src/config/token.ts`.
