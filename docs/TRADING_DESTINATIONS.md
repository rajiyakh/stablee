# Trading Destinations — the Buy button

## What it does not do

The Buy button on a Robinhood Mainnet token (Markets tables, token detail drawer) never
executes a transaction, never connects a wallet, and never requests wallet permissions on
click. It only opens a confirmation dialog that, if the user continues, opens a whitelisted
external URL in a new tab (`target="_blank" rel="noopener noreferrer"`). All actual trading
happens on that third-party site, outside this app.

## The registry

`src/config/tradingDestinations.ts` defines a fixed array of `TradingDestination` entries.
A provider response (GMGN or otherwise) can never inject, override, or influence which
destination is used or what URL is built — every URL is constructed from a hardcoded
template plus a validated on-chain address, and `resolveTradingDestination()` re-checks the
resolved URL's protocol (`https:` only) and hostname against the destination's own
`domain` field before ever returning it. If a provider response somehow contained a
malicious or unexpected URL in some future field, it would never reach this path — nothing
here reads a trading URL out of the raw GMGN response except the intentionally-inert
`gmgn-provider-supplied` slot described below.

## Priority order (lower priority number tried first)

| # | id | Status | Why |
|---|---|---|---|
| 1 | `robinhood-aggregator` | Disabled, empty `buildTokenUrl` | No owner-configured Robinhood-native aggregator exists yet. This slot exists so one can be enabled later by filling in a real, reviewed URL template — never a guessed one. |
| 2 | `gmgn-provider-supplied` | Disabled | GMGN's confirmed real `rank`/`hot-searches` response fields (`website`, `twitter`, `telegram`) do not include a dedicated trading-URL field. This slot exists for the shape the spec requires but stays inert until such a field is confirmed to exist. |
| 3 | `gmgn-token-page` | **Enabled** | `https://gmgn.ai/robinhood/token/{address}` — GMGN's own well-established `gmgn.ai/{chain}/token/{address}` URL scheme, consistent with the confirmed `gmgn.ai/trend?chain=robinhood` pages. This is the only destination that actually opens today. |
| 4 | `uniswap` | **Enabled** | Confirmed live via Uniswap's own blog post ("Uniswap is Live on Robinhood Chain") and developer docs (real v3 factory/router/UniversalRouter addresses published for chain 4663). The `chain=robinhood` URL slug was found as a real, already-indexed `app.uniswap.org` URL and confirmed to return HTTP 200 before this was enabled — never guessed. Ranked below `gmgn-token-page`, so it's reached only if GMGN's URL somehow fails to build. |
| 5 | `detected-dex` | Disabled | A per-pair DEX name (`dexName` from GMGN) is not yet verified to map to a real, safe, chain-correct trading URL for Robinhood Mainnet pairs. |

If no enabled destination resolves for a token (currently: if `gmgn-token-page`'s address
validation somehow fails), the Buy button renders disabled with the exact required copy:
**"No verified trading route is currently available for this token."**

## Enabling a new destination

To enable one of the disabled slots (e.g. once a Robinhood aggregator exists, or Uniswap
confirms Robinhood Chain support):

1. Set `enabled: true`.
2. Set `domain` to the exact hostname the built URL will use — this is a hard check, not
   documentation, so a mismatch here means the destination silently never resolves.
3. Implement `buildTokenUrl()` to return a real URL, or `null` if the specific token doesn't
   qualify (e.g. Uniswap's `isVerifiedFor()` should check the token is actually listed on
   Robinhood Chain there, not just assume every Robinhood Mainnet token is tradeable
   everywhere).
4. Implement `isVerifiedFor()` as a real check, not a constant `true` — this is the
   verification gate the spec requires, expressed as code.

## Confirmation dialog

`src/features/markets/ExternalTradeConfirmation.tsx` shows token identity, network,
destination, liquidity, market cap, and verification status, plus the exact required
warning:

> You are leaving RobinPulse AI and opening a third-party trading interface. Verify the
> token contract, network, liquidity, price impact, and slippage before connecting a wallet
> or submitting a transaction.

Only "Continue to Trading Interface" opens the external URL; "Cancel" closes the dialog with
no navigation.
