# Treasury Setup — `ROBINPULSE_FEE_RECIPIENT`

## The only source of truth

The RobinPulse platform-fee recipient comes from exactly one place:

```
ROBINPULSE_FEE_RECIPIENT=
```

`src/lib/swap/feeConfig.server.ts`'s `serverFeeRecipient()` reads this value, validates it
against `/^0x[a-fA-F0-9]{40}$/`, and returns `null` if it's empty or malformed. There is no
fallback address anywhere in the codebase — not a developer wallet, not a generated address, not
a hardcoded sample. If `serverFeeRecipient()` returns `null`:

- `/api/swap/price` and `/api/swap/quote` both return a `not_configured` response with the exact
  copy: *"RobinPulse fee collection has not been configured. Live swapping is unavailable."*
- `zeroExConfigured()` returns `false`, so no request to 0x is ever made.

This was the actual state throughout this build — no real treasury address was available, so
this path was exercised and confirmed via a dev-server screenshot rather than skipped.

## Why a multisig is recommended

A single EOA (externally-owned account) holding a fee-collection address is a single point of
failure — one leaked private key means every fee ever collected there is at risk, with no
recovery path. A multisig (e.g. Safe{Wallet} deployed on Robinhood Chain, if supported, or on a
chain the owner bridges fees to) requires multiple independent approvals to move funds, which:

- Survives a single compromised device/key.
- Creates an auditable approval trail for fee withdrawals.
- Separates "who can receive fees" from "who can spend them," if the multisig signers differ
  from whoever operates the RobinPulse deployment.

RobinPulse does not deploy or manage this multisig — it's an owner responsibility, independent of
this codebase. Once created, its address is simply what goes into `ROBINPULSE_FEE_RECIPIENT`.

## Setting it up

1. Confirm Robinhood Chain (id 4663) tooling support for your multisig provider of choice, or
   decide to receive fees at a multisig on another chain and bridge/sweep periodically.
2. Deploy the multisig and record its address.
3. **Before setting the env var**: independently verify the address via the multisig provider's
   own UI/API — never trust an address pasted into a chat, ticket, or email without confirming it
   against the provider directly.
4. Set `ROBINPULSE_FEE_RECIPIENT=<the address>` in the hosting platform's environment variables
   (see `docs/DEPLOYMENT.md` for how this project sets Vercel env vars) — never in a committed
   file.
5. Redeploy, then confirm `/swap` no longer shows the "not configured" message.
6. Complete one small real test swap and confirm the fee arrives at the configured address on
   the block explorer (`https://robinhoodchain.blockscout.com`) before announcing live swapping.

## Rotating the address

Changing `ROBINPULSE_FEE_RECIPIENT` takes effect on the next request after redeployment — there
is no caching of the old value beyond the process lifetime of a warm serverless instance. No code
change is required to rotate it, only an env var update and redeploy.

## What this document does not cover

This repo has no custody of user funds at any point — swaps execute directly through 0x's
audited AllowanceHolder contracts, and the fee is paid by 0x's own contract logic to whatever
`swapFeeRecipient` was set on the request. There is no RobinPulse-held balance, withdrawal
function, or admin key to secure beyond the fee-recipient address itself.
