# Bridge Fee Model

## The numbers

| Parameter             | Value           | Env var                                                                |
| --------------------- | --------------- | ---------------------------------------------------------------------- |
| Default platform fee  | 100 bps (1.00%) | `BRIDGE_PLATFORM_FEE_BPS`                                              |
| Hardcoded fee ceiling | 100 bps (1.00%) | not env-configurable — `BRIDGE_FEE_BPS_MAX` in `src/lib/bridge/fee.ts` |

Same discipline as `docs/SWAP_FEE_MODEL.md`: the env var can only lower the fee, never raise it
above the hardcoded ceiling. Unlike swap, the bridge fee **is** always shown to the user — the
spec requires it displayed as "RobinPulse Platform Fee / 1.00%" before every confirmation, and
`BridgeFeeBreakdown.tsx` renders exactly that.

## The one invariant

`platformFeeAmount` on a `NormalizedBridgeQuote` is only ever populated by reading it back out of
the provider's own parsed response. `normalize.ts` never computes `input × bps` and presents that
as the charged fee. `computeBridgeFeeBps()` (`src/lib/bridge/fee.ts`) is used only to (a) build
the outbound request parameter sent to the provider and (b) run a consistency check
(`checkPlatformFee`) against what the provider actually reports charging.

`checkPlatformFee`, called by `validateBridgeQuote()` only when `quote.meta.feeMode ===
"provider-native"` (i.e. the adapter that produced this quote actually has its fee-collection
gate confirmed — see below; an unconfirmed adapter's quotes carry `feeMode: "unavailable"` and
skip this check entirely, since there's no fee to consistency-check yet):

- **`fee_missing`** — the provider was asked to carry the fee but reports none. The route is
  excluded, never rendered as if the fee were collected.
- **`fee_mismatch`** — the reported fee deviates from the expected amount by more than a small
  rounding tolerance. Catches both overcharging and a fee applied twice (a doubled 1% fee is
  ~100bps off expected, far outside a 2bps tolerance).
- **`invalid_fee_amount`** — the provider's `inputAmount` or `platformFeeAmount` isn't a
  well-formed base-unit integer string. Never guessed at, the route is excluded instead.

## Per-provider mechanism

| Provider | Mechanism                                                                                                                                                                                                                                                                                                                                                                                           | Confirmed via                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| LI.FI    | `@lifi/sdk`'s `fee` param (`computeBridgeFeeBps()/10000`, never a literal `0.01`) + `integrator: "robinpulse"`. Read back from `estimate.feeCosts[].feeSplit.integratorFee` (the SDK's authoritative per-recipient breakdown), falling back to name-matching a `feeCosts` entry only when `feeSplit` is entirely absent. Only treated as fee-bearing once `LIFI_PAYOUT_CONFIRMED=true` — see below. | `@lifi/types`' real `FeeCost`/`FeeSplit` interfaces.                                               |
| Relay    | Relay's `appFees: [{recipient, fee}]` request param, only sent when `RELAY_APP_FEE_CONFIRMED=true`. Read back from `fees.app.amount`.                                                                                                                                                                                                                                                               | Relay's public docs (`/quote/v2`); response shape not fully verified — see `docs/BRIDGE_SETUP.md`. |
| Across   | `appFeeBps`/`appFeeRecipient` request params, only sent when `ACROSS_APP_FEE_CONFIRMED=true`. Read back from `fees.total.details.app.amount` — Across's own first-class app-fee slot.                                                                                                                                                                                                               | Live-confirmed real response from `app.across.to/api/swap/approval`.                               |
| Gas.zip  | None — `feeMode()` always returns `"unavailable"`.                                                                                                                                                                                                                                                                                                                                                  | N/A — see `docs/BRIDGE_SETUP.md`.                                                                  |

## Why LI.FI needs its own confirmation flag

Unlike Relay and Across, LI.FI's requests never carry `ROBINPULSE_TREASURY_ADDRESS` at all — there
is no `recipient`-style field in the LI.FI SDK's quote request. LI.FI's fee model instead pays the
integrator cut out to whatever wallet is registered against the `"robinpulse"` integrator account
on **LI.FI's own partner dashboard**, a step entirely outside this codebase and independent of
whatever value sits in `.env`. `lifiConfigured()` checking that _some_ treasury address is set is
only a readiness proxy — it cannot verify that address is the one actually registered on LI.FI's
side.

`LIFI_PAYOUT_CONFIRMED` closes that gap the same way `RELAY_APP_FEE_CONFIRMED` /
`ACROSS_APP_FEE_CONFIRMED` do: `feeMode()` returns `"unavailable"` (LI.FI excluded from results
entirely) until a human has manually logged into LI.FI's dashboard, confirmed the registered
payout wallet exactly matches `ROBINPULSE_TREASURY_ADDRESS`, and only then set the flag to
`"true"`. This is the one link in the whole fee model that no automated check can ever close — it
depends on two independently-set values (an env var here, a dashboard field on LI.FI's servers)
actually agreeing, which only a human comparing both can confirm.

## Explicitly rejected alternative

A second, separate on-chain transfer of 1% to the treasury alongside the bridge transaction was
considered and rejected: it requires a second signature and a second gas payment, a user could
approve one leg and reject the other (fee collected, no bridge — or the reverse), and it doesn't
compose with native-asset routes. The spec's own fallback — "a separately-audited fee-forwarding
contract after explicit approval" — is out of scope for the current implementation.

## Changing the fee safely

Same process as `docs/SWAP_FEE_MODEL.md`: change `BRIDGE_PLATFORM_FEE_BPS` in hosting env vars (no
code change, as long as ≤ 100). Raising the 100bps ceiling itself requires editing
`BRIDGE_FEE_BPS_MAX` in `src/lib/bridge/fee.ts`, updating `fee.test.ts`'s boundary assertions, and
redeploying.
