# Swap Fee Model

## The numbers

| Parameter | Value | Env var |
|---|---|---|
| Default platform fee | 10 bps (0.10%) | `ROBINPULSE_SWAP_FEE_BPS` |
| Hardcoded fee ceiling | 30 bps (0.30%) | not env-configurable — see below |
| Minimum swap amount | $20 | `ROBINPULSE_MINIMUM_SWAP_USD` |
| Minimum expected fee | $0.02 | fixed — `MIN_FEE_USD` in `src/lib/swap/fees.ts` |
| 0x's own platform limit on `swapFeeBps` | 1000 bps (10%) | not RobinPulse's concern — we stay far under it |

$20 × 0.10% = $0.02 — the minimum swap amount exists specifically to guarantee the minimum fee
is meetable, per the spec's requirement.

## Why the 30 bps ceiling is hardcoded, not env-read

`ROBINPULSE_SWAP_FEE_BPS` (the fee actually charged) is read from the environment and can be
tuned per deployment — e.g. a promotional 5 bps period. `ROBINPULSE_MAX_SWAP_FEE_BPS=30` exists
in `.env.example` for documentation/self-description, but the actual safety ceiling enforced in
code (`FEE_BPS_MAX` in `src/lib/swap/fees.ts`) is a compile-time constant of `30`, not read from
that env var. This is deliberate: a misconfigured or compromised environment variable should
never be able to silently raise the fee cap. Changing the real ceiling requires a code change and
a new deployment, not just an env edit.

## How the fee is charged

RobinPulse never invents a fee amount. Every request to 0x includes:

```
swapFeeRecipient=<ROBINPULSE_FEE_RECIPIENT>   (server-only, from feeConfig.server.ts)
swapFeeBps=<computeSwapFeeBps(), clamped to 30>
swapFeeToken=<selectFeeToken(sellToken, buyToken)>
```

0x charges the fee onchain and returns the real amount in `fees.integratorFee.{amount,token,type}`.
The UI shows exactly that value — `src/routes/api/swap/quote.ts` and `price.ts` never
recompute, round, or otherwise second-guess it after the firm quote is returned.

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

## Verifying the $20 minimum before requesting a firm quote

1. `resolveUsdValue()` (`src/lib/swap/usdValue.server.ts`) prices the sell amount — see its
   4-tier priority in `docs/0X_SWAP_SETUP.md`'s linked source, or just read the file: USDG face
   value → 0x indicative price against USDG → Chainlink (real code, currently unconfigured) →
   DEX Screener (reusing the site's existing Robinhood Mainnet provider).
2. If the USD value can't be determined by any tier, the swap is blocked with:
   *"Unable to verify the USD value of this trade. RobinPulse cannot confirm the minimum
   platform fee, so this swap cannot be submitted."*
3. If it's determinable but below $20:
   *"Minimum swap amount is $20 to cover the RobinPulse platform fee."*
4. Neither check ever silently raises the user's typed amount to meet the minimum — the user
   must increase it themselves.

## Verifying the fee again at the firm-quote stage

Prices move between the indicative price call and the firm quote. `src/routes/api/swap/quote.ts`
re-runs the $20 check immediately before calling 0x, and after the firm quote returns,
`validateQuote()` re-checks that `fees.integratorFee` is present and its USD value (again via
`resolveUsdValue()`, priced on the fee token specifically — not derived proportionally from the
sell-side USD value) is at least $0.02. If it's below that:

*"The current quote does not meet the minimum platform fee requirement. Increase the swap amount
and request a new quote."*

## Changing the fee safely

1. Change `ROBINPULSE_SWAP_FEE_BPS` in the hosting platform's env vars (no code change needed,
   as long as the new value is ≤ 30).
2. To raise the 30 bps ceiling itself, edit `FEE_BPS_MAX` in `src/lib/swap/fees.ts`, update the
   corresponding Vitest boundary tests in `fees.test.ts`, and redeploy — this is an intentional
   extra step, not an oversight.
3. Never change the fee recipient by editing anything other than `ROBINPULSE_FEE_RECIPIENT` — see
   `docs/TREASURY_SETUP.md`.
