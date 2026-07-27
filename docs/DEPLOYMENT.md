# Deployment

## Live deployment

**https://robinpl.vercel.app** — Vercel project `far-tryer-s-projects/robinpl`.

Deployed via `vercel deploy --prebuilt`, not a git integration — there is no connected GitHub repo yet, so deploys are manual. To redeploy after a change:

```bash
NITRO_PRESET=vercel npm run build
vercel deploy --prebuilt --prod --scope far-tryer-s-projects
```

`NITRO_PRESET=vercel` is required: this template's shared Vite config (`@lovable.dev/vite-tanstack-config`) defaults Nitro to the `cloudflare-module` preset. Overriding the env var at build time switches the output to Vercel's Build Output API format (`.vercel/output`) without touching the shared config.

Production environment variables are already set on the Vercel project (`vercel env ls production --scope far-tryer-s-projects`) — see the list below; update them there (`vercel env add`), not in a committed file, if any value changes.

## Build

```bash
npm install
npm run build
```

Output is produced by Vite/Nitro (TanStack Start). No test script exists in this repo yet — see docs/SECURITY_REVIEW.md for the recommendation to add CI checks (lint, typecheck, `npm audit`) before production.

## Required environment variables in production

At minimum:

```
VITE_APP_NAME=RobinPulse AI
COINGECKO_API_BASE_URL=https://api.coingecko.com/api/v3
DEXSCREENER_API_BASE_URL=https://api.dexscreener.com
GECKOTERMINAL_API_BASE_URL=https://api.geckoterminal.com/api/v2
GECKOTERMINAL_ROBINHOOD_NETWORK_ID=robinhood
VITE_ROBINHOOD_DEXSCREENER_CHAIN_ID=robinhood
ROBINHOOD_CHAIN_ID=4663
ROBINHOOD_CHAIN_NAME=Robinhood Chain
ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com
ROBINHOOD_EXPLORER_URL=https://robinhoodchain.blockscout.com
ROBINHOOD_NATIVE_CURRENCY_NAME=Ether
ROBINHOOD_NATIVE_CURRENCY_SYMBOL=ETH
VITE_ROBINHOOD_CHAIN_ID=4663
VITE_ROBINHOOD_CHAIN_NAME=Robinhood Chain
VITE_ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com
VITE_ROBINHOOD_EXPLORER_URL=https://robinhoodchain.blockscout.com
VITE_ROBINHOOD_NATIVE_CURRENCY_NAME=Ether
VITE_ROBINHOOD_NATIVE_CURRENCY_SYMBOL=ETH
```

All of the above are already set in the live Vercel project's Production environment.

Recommended for higher CoinGecko rate limits: `COINGECKO_API_KEY` (server-only, never prefix it with `VITE_`) — not yet set. Optional social/contact/documentation links — see docs/PROJECT_CONFIGURATION.md — not yet set.

**Never commit `.env`.** It is excluded via `.gitignore`; only `.env.example` (with empty values) should be committed.

## Platform notes

Deployed on Vercel (Node.js serverless functions), not Cloudflare — the app's own rate limiter (`guard()` in `src/lib/market/api.server.ts`) reads `cf-connecting-ip` first, falling back to `x-forwarded-for`, which Vercel does set. See docs/SECURITY_REVIEW.md for the in-memory state caveat specific to serverless (rate limiter counts and the AI feed's rolling event store are per-instance, not shared across cold starts/regions).

## Security headers

Set via `nitro.routeRules` in `vite.config.ts` — **not** a top-level `vercel.json`, which `vercel deploy --prebuilt` silently ignores (it only reads the generated `.vercel/output/config.json`). `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` are set on every route this way, so they're regenerated correctly on every rebuild; `Strict-Transport-Security` comes from Vercel's own platform edge. Verify after any redeploy:

```bash
curl -sI https://robinpl.vercel.app/ | grep -i "content-security-policy\|strict-transport"
```

`script-src` includes `'unsafe-inline'` (required for TanStack Start's inline SSR hydration script — no nonce infra exists in this app) and `frame-src` allowlists three hosts (`dexscreener.com`, `tradingview-widget.com`, `s.tradingview.com` — the TradingView widget uses two, not one). **Always re-test the deployed site with a real browser after touching this CSP** — a too-strict `script-src` breaks the entire app silently (no error page, just `Invariant failed` in the console on every route), and a too-strict `frame-src` breaks only the specific embeds without otherwise being obvious. Both happened once during this project's own rollout before being caught by post-deploy testing.

## Pre-production checklist

- [x] Set every env var above in the hosting platform's secret manager, not in a committed file
- [x] Add a CSP allowlisting exactly what the app loads (`s3.tradingview.com`, `tradingview-widget.com`, `s.tradingview.com`, `dexscreener.com`) — `nitro.routeRules` in `vite.config.ts`, verified live with a real browser, not just a header-presence check
- [x] Reviewed `npm audit` — 0 production vulnerabilities; devDependency-only ESLint chain deliberately deferred (see docs/SECURITY_REVIEW.md)
- [x] Confirmed `lovable-error-reporting.ts`'s globals are not wired to a live endpoint
- [ ] Add `npm audit` / Dependabot to CI (blocked on: no git repo/CI pipeline exists yet)
- [ ] Load-test the in-memory rate limiter / feed store's behavior under real multi-region Vercel traffic
- [ ] Commission an independent security review before handling real user funds, accounts, or the eventual protocol token contract
- [ ] Set `COINGECKO_API_KEY`, social links, `src/config/token.ts` details, `verifiedTokens.ts` entries, and `VITE_WALLETCONNECT_PROJECT_ID` when the owner has them
