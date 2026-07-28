# Swap Fee Model

## The numbers

| Parameter | Value | Env var |
|---|---|---|
| Default platform fee | 100 bps (1.00%) | `ROBINPULSE_SWAP_FEE_BPS` |
| Hardcoded fee ceiling | 100 bps (1.00%) | not env-configurable — see below |
| Minimum swap amount | none | — |
| 0x's own platform limit on `swapFeeBps` | 1000 bps (10%) | not RobinPulse's concern — we stay far under it |

There is no minimum swap amount and no minimum-fee floor. Every swap, regardless of size, is
charged the same 1% fee, sent to the treasury wallet. The one remaining server-side check is
mechanical, not a policy: if the computed fee rounds to literally 0 in the fee token's base units,
`validateQuote()` rejects the quote with `fee_missing` — there's nothing to charge, not "too little
to bother with."

The fee percentage/amount is intentionally not shown anywhere in the swap UI (neither the inline
quote details nor the confirm dialog) — it's still charged exactly as described here, just not
surfaced as a line item to the user.

## Why the 100 bps ceiling is hardcoded, not env-read

`ROBINPULSE_SWAP_FEE_BPS` (the fee actually charged) is read from the environment and can be
tuned per deployment. `ROBINPULSE_MAX_SWAP_FEE_BPS` exists in `.env.example` for
documentation/self-description, but the actual safety ceiling enforced in code (`FEE_BPS_MAX` in
`src/lib/swap/fees.ts`) is a compile-time constant, not read from that env var. This is
deliberate: a misconfigured or compromised environment variable should never be able to silently
raise the fee cap. Changing the real ceiling requires a code change and a new deployment, not
just an env edit. **Note:** since the default and the ceiling are currently equal (100 bps), the
env var can only ever lower the fee below 1%, never raise it — raising it requires editing
`FEE_BPS_MAX` itself.

## How the fee is charged

RobinPulse never invents a fee amount. Every request to 0x includes:

```
swapFeeRecipient=<ROBINPULSE_FEE_RECIPIENT>   (server-only, from feeConfig.server.ts)
swapFeeBps=<computeSwapFeeBps(), clamped to 100>
swapFeeToken=<selectFeeToken(sellToken, buyToken)>
```

0x charges the fee onchain and returns the real amount in `fees.integratorFee.{amount,token,type}`.
`src/routes/api/swap/quote.ts` and `price.ts` never recompute, round, or otherwise second-guess it
after the firm quote is returned — even though the UI no longer displays it as a line item, the
server-side values are still the real, unmodified numbers 0x returned.

## Fee token selection (`selectFeeToken` in `src/lib/swap/fees.ts`)

Priority order, exactly as specified:

1. USDG, if it's the sell or buy token.
2. Another `isStablecoin: true` entry from `swapTokens.ts`, if configured and involved in the
   swap (none beyond USDG exist yet — the registry starts with just the two canonical tokens).
3. The buy token.
4. The sell token (only reached if 1–3 don't apply, which given step 3 always succeeds when a
   buy token exists, means step 4 is effectively unreachable in the current registry — it exists
   for completeness against the spec's stated priority order).

The function's return value is always either `sellToken` or `buyToken` — 0x requires
`swapFeeToken` to be one of the two, and there is no code path that can return anything else.

## Why sell-side USD value is still resolved

Even with no minimum-swap gate, `/api/swap/price` and `/api/swap/quote` still call
`resolveUsdValue()` (`src/lib/swap/usdValue.server.ts`) on the sell amount — see its 4-tier
priority in `docs/0X_SWAP_SETUP.md`'s linked source, or just read the file: USDG face value → 0x
indicative price against USDG → Chainlink (configured for 8 tokenized-equity feeds, see
`chainlinkFeeds.ts`) → DEX Screener (reusing the site's existing Robinhood Mainnet provider). That
value feeds `priceImpactBps` (still computed and still blocks execution at the existing 3%
threshold — see `PRICE_IMPACT_MAX_BPS`) and the server-side `feeUsd` field (no longer rendered in
the UI, but still computed for potential future use/analytics). It's purely
informational/protective now, not a gate on swap size — `computePriceImpactBps()` is already
null-safe when the USD value can't be resolved.

## Firm-quote validation

`validateQuote()` (`src/lib/swap/validateQuote.ts`) still re-checks, on the firm quote returned
from `/api/swap/quote`: liquidity, token match, transaction presence, balance/simulation issues,
that `fees.integratorFee` is actually present (`fee_missing` — the one remaining mechanical fee
check, see above), quote expiry, and the 3% price-impact ceiling. There is no fee-USD-value check
anymore.

## Changing the fee safely

1. Change `ROBINPULSE_SWAP_FEE_BPS` in the hosting platform's env vars (no code change needed,
   as long as the new value is ≤ 100).
2. To raise the 100 bps ceiling itself, edit `FEE_BPS_MAX` in `src/lib/swap/fees.ts`, update the
   corresponding Vitest boundary tests in `fees.test.ts`, and redeploy — this is an intentional
   extra step, not an oversight.
3. Never change the fee recipient by editing anything other than `ROBINPULSE_FEE_RECIPIENT` — see
   `docs/TREASURY_SETUP.md`.
