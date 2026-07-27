# 0x Swap API Setup — `/swap`

## What this powers

`/swap` — token swaps on Robinhood Chain (id 4663) via [0x Swap API v2](https://docs.0x.org)'s
AllowanceHolder flow, with a transparent RobinPulse platform fee collected through 0x's own
integrator-fee mechanism. RobinPulse never custodies funds and does not deploy a custom swap
contract — every transaction sent is the exact `transaction.{to,data,value,gas}` 0x returns.

## Confirmed facts (verified against 0x's own docs, not assumed)

- 0x Swap API v2 officially lists chain ID 4663 as **"Robinhood"** in its supported-chains list.
- Endpoints used: `GET https://api.0x.org/swap/allowance-holder/price` (indicative) and
  `GET https://api.0x.org/swap/allowance-holder/quote` (firm/executable). `swapFeeBps` has a
  platform-side cap of 1000 bps (10%) — our 30 bps ceiling is well inside that.
- The response has **no expiry field** — "quote expiry" shown in the UI is an app-side 30s TTL
  from fetch time (`QUOTE_TTL_MS` in `src/config/swapPolicy.ts`), not a real API value.
- The response has **no price-impact field** — RobinPulse computes it from two independently
  resolved USD values (sell side vs. buy side; see `src/lib/swap/priceImpact.ts`), never a
  guessed percentage.

## Getting an API key

Create an account at [dashboard.0x.org](https://dashboard.0x.org), create an app, and copy its
API key into:

```
ZEROX_API_KEY=your-key-here
```

Set this in `.env` for local development or the hosting platform's environment variables in
production (see `docs/DEPLOYMENT.md`). **Never** prefix it with `VITE_` — that would bundle it
into client JavaScript and ship it to every visitor's browser.

## Why the server is the only thing that talks to 0x

`src/lib/swap/zeroEx.server.ts` is a `.server.ts` file — this repo's ESLint config fails the
build if a `.server.ts` module is ever imported from client code, which is the mechanism that
guarantees `ZEROX_API_KEY` never reaches the browser. Confirmed after this build: `grep -rl
ZEROX_API_KEY .vercel/output/static` returns zero matches.

The browser only ever calls RobinPulse's own routes:

```
Browser → /api/swap/price or /api/swap/quote
        → guard() rate limit
        → notConfigured() if ZEROX_API_KEY or the treasury address is missing
        → requestSchemas.ts validates sellToken/buyToken/amount/taker/slippageBps ONLY
        → zeroEx.server.ts injects chainId=4663, swapFeeRecipient, swapFeeBps, swapFeeToken
        → schemas.ts (Zod) validates 0x's response shape
        → resolveUsdValue() prices the trade and the fee
        → validateQuote() runs the full checklist
        → jsonOk(envelope("zeroex", ...))
```

## Robinhood Chain configuration

Chain facts come from `projectConfig.wallet` (`src/config/project.ts`), itself populated from
the already-documented `VITE_ROBINHOOD_*` env vars (see `docs/WALLET_SETUP.md` and
`docs/ADDING_ROBINHOOD_NETWORK.md`). `src/config/robinhoodChain.ts` builds the wagmi `Chain`
object from those fields rather than a second hardcoded copy, so `.env` stays the single source
of truth. Wallet features (including `/swap`) only activate once `VITE_WALLET_ENABLED=true` and
every required wallet field, including `VITE_WALLETCONNECT_PROJECT_ID`, is set.

## Curated token list

`src/config/swapTokens.ts` ships with four canonical Robinhood Chain addresses, each confirmed
directly against `robinhoodchain.blockscout.com`'s own token API (not a symbol match, not a
secondary source):

| Symbol | Address | Decimals |
|---|---|---|
| WETH | `0x0bd7d308f8e1639fab988df18a8011f41eacad73` | 18 |
| USDG (Global Dollar) | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` | 6 |
| AAPL (Robinhood Tokenized Equity) | `0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9` | 18 |
| AMZN (Robinhood Tokenized Equity) | `0x12f190a9F9d7D37a250758b26824B97CE941bF54` | 18 |

AAPL and AMZN also have a cross-verified Chainlink price feed wired in — see
`src/config/chainlinkFeeds.ts`.

**Beyond the curated list**: `/api/swap/price` and `/api/swap/quote` also accept any token
`resolveSwapToken()` (`src/lib/swap/discoverTokens.server.ts`) can resolve — the curated list
first, then GMGN's Robinhood Mainnet trending dataset (when `GMGN_API_KEY` is configured) with
each candidate's decimals independently confirmed via an on-chain `decimals()` read before it's
ever treated as swappable. This closes the gap the spec's broader "Token Selection" section
asked for (GMGN dataset as a source) while keeping the same safety property as the curated list:
decimals are never trusted from an off-chain source for the $20/$0.02 checks. Discovered tokens
are marked `verified: false` and show the Unverified badge + risk warnings in the UI. Add more
manually-curated entries to `swapTokens.ts` the same way AAPL/AMZN were added: confirm the
address via Blockscout's token API, never from a single unverified source.

Native ETH selling ships **disabled** (`NATIVE_SELL_ENABLED = false` in `swapTokens.ts`) — the
`0xEeee...EEeE` native-asset sentinel is the standard convention across DeFi tooling but was not
observed in an actual 0x response this session. Before enabling it, make one real
`GET /swap/allowance-holder/price?sellToken=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&...`
call and confirm 0x accepts it for chain 4663.

## Testing without live credentials

No `ZEROX_API_KEY`, `ROBINPULSE_FEE_RECIPIENT`, or `VITE_WALLETCONNECT_PROJECT_ID` was available
in the session that built this feature. What was verified:

- With the key/treasury unset, `/swap` shows the exact required not-configured copy.
- 52 Vitest unit/integration tests pass, covering fee math, quote validation, Zod schemas, the
  request-schema tampering guarantee, and BigInt decimal edge cases — all against mocked/fixture
  data, never live 0x responses.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `NITRO_PRESET=vercel npm run build`
  all pass clean.
- The client bundle was grepped for every secret env var name — zero matches.

**Not verified this session, and must not be claimed as tested**: a real 0x price/quote round
trip, a real wallet connect/approve/swap sequence, or an actual Robinhood Chain transaction. See
the Production Launch Checklist below before treating this as live-ready.

## Production launch checklist

1. Set a real `ZEROX_API_KEY`.
2. Set a real, ideally multisig, `ROBINPULSE_FEE_RECIPIENT` (see `docs/TREASURY_SETUP.md`).
3. Set `VITE_WALLETCONNECT_PROJECT_ID` and `VITE_WALLET_ENABLED=true`.
4. Set `ROBINHOOD_RPC_URL` to a production (non-public, non-rate-limited) RPC endpoint.
5. Make one real `GET /swap/allowance-holder/price` call and inspect the response shape against
   `src/lib/swap/schemas.ts` — confirm nothing has changed since this was written.
6. Complete one small real swap on Robinhood Chain mainnet end-to-end (connect → approve → swap →
   receipt) before telling users live swapping is ready.
7. Re-run every check in this document's "Testing without live credentials" section against the
   real environment.
