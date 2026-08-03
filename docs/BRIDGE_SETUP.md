# Bridge Setup

The Bridge tab (`/app/swap?tab=bridge`) aggregates quotes from LI.FI, Relay, and Across, and
ranks them by actual amount received after all fees. It ships fully built but **soft-disabled**
— every route returns `notConfigured` / renders a "Bridging isn't live yet" notice — until the
credentials below are supplied. This mirrors exactly how `/swap` behaves without `ZEROX_API_KEY`.

## Required for any bridging to work at all

| Env var                       | What it is                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ROBINPULSE_TREASURY_ADDRESS` | The wallet that receives RobinPulse's 1% platform fee. Must be a valid EVM address — see `docs/TREASURY_SETUP.md`. A multisig is strongly recommended. |
| `VITE_BRIDGE_ENABLED=true`    | The client-side kill switch. Also extends the wallet's chain list beyond Robinhood Mainnet (see "Wallet config" below).                                |

## Per-provider credentials

| Provider | Env vars                                                                  | Where to get them                                                                                                                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LI.FI    | `LIFI_API_KEY`, `LIFI_INTEGRATOR=robinpulse`                              | Register an integrator account at LI.FI's partner portal; the API key and integrator string come from there. The integrator registration is also where RobinPulse's treasury wallet gets linked for fee payout — this is a step only the account owner can complete. |
| Relay    | `RELAY_API_KEY`, `RELAY_APP_FEE_CONFIRMED=true`                           | Contact Relay to enable App Fees for RobinPulse's integration. Until `RELAY_APP_FEE_CONFIRMED` is explicitly set to `true`, Relay's routes are excluded from results entirely — RobinPulse never modifies Relay's calldata to insert a fee itself.                   |
| Across   | `ACROSS_API_KEY`, `ACROSS_INTEGRATOR_ID`, `ACROSS_APP_FEE_CONFIRMED=true` | Register for Across Swap API access and an integrator ID. Same App Fee confirmation gate as Relay applies.                                                                                                                                                           |
| Gas.zip  | `GASZIP_ENABLED=false` (default, intentional)                             | Not applicable — see below.                                                                                                                                                                                                                                          |

## Why Gas.zip stays disabled

Gas.zip is a native-ETH gas-refuel drip service (send value on one chain, receive small amounts
split across one or more destination chains) — not a general arbitrary-ERC20 bridge like the
other three. Its adapter (`src/lib/bridge/providers/gaszip.server.ts`) is real and reports real
chain support, but `feeMode()` always returns `"unavailable"` (no documented platform-fee
mechanism exists), so it can never produce a fee-bearing route regardless of `GASZIP_ENABLED`.
The flag exists to make the disabled state explicit and testable, per the spec's own instruction.

## Confirmed live, at planning time

All four providers' public chain registries already list Robinhood Mainnet (chain ID 4663):
LI.FI (`li.quest/v1/chains`), Relay (`api.relay.link/chains`), Across
(`app.across.to/api/swap/chains`), Gas.zip (`backend.gas.zip/v2/chains`). LI.FI's own registry
flags the chain `"Unverified (flagged by hypernative)"` — surfaced verbatim in the UI via each
chain's `riskNote`, never suppressed. Chain-registry presence is not the same as a liquid,
quotable route for a specific token pair — the runtime per-request quote call
(`routeEngine.server.ts`) is the real gate; a chain being listed doesn't guarantee any given
token pair actually has a route.

Across's `GET /api/swap/{chains,tokens,approval}` endpoints were exercised live and their real
response shapes captured into `src/lib/bridge/providers/schemas/across.ts` and
`normalizeAcrossQuote()`. Relay's `/quote/v2` response shape was **not** fully confirmed — Relay's
own docs did not clearly surface where input/output amounts live in the response despite repeated
attempts. `schemas/relay.ts` and `normalizeRelayQuote()` are written defensively (multiple
fallback field paths, never a fabricated amount) as a result — verify against a real captured
response before relying on Relay for fee-bearing production routes.

## Wallet / multi-chain config

Bridging requires signing on a chain other than Robinhood Mainnet for the source leg.
`src/config/bridgeChains.ts` supplies `mainnet`, `arbitrum`, `base`, `optimism`, `polygon`, `bsc`
(from `viem/chains`) alongside Robinhood Chain to `src/config/wagmi.ts` / `src/config/privy.ts`,
but **only when `VITE_BRIDGE_ENABLED=true`** — with the flag unset, the wallet config is
byte-identical to the pre-bridge single-chain setup (see `bridgeChains.test.ts`).

## Verifying it's live

1. `GET /api/bridge/providers` — shows `configured`/`feeMode` per provider without exposing keys.
2. Paste a real source-chain token address into the Bridge tab and confirm route cards render
   with the mandatory fee breakdown, matching the numbers each provider's own API returned.
3. Real bridge execution with real funds cannot be tested by an automated agent — the first live
   bridge should be run by a human with a small amount, on a route already spot-checked in step 2.
