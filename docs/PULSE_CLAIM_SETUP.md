# $PULSE Claim Setup

TGE and claim status live at `src/config/tge.ts`, exported as `tgeConfig`. Every field defaults to the most conservative, honest state — no countdown, no assumed launch date, no claim ever enabled by default.

## Entry shape

```ts
export const tgeConfig = {
  status: "not-announced", // see status list below
  date: "", // ISO date string once scheduled, empty = "To be announced"
  claimEnabled: false,
  distributionMode: "not-decided", // "contract-claim" | "manual-distribution" | "not-decided"
  announcementUrl: "",
};
```

## Status values

`"not-announced"` (default) · `"scheduled"` · `"farming-active"` · `"tge-complete"` · `"claim-live"` · `"distribution-pending"` · `"distribution-complete"`

`isClaimLive()` only returns `true` when `status === "claim-live"` **and** `claimEnabled === true` — both conditions, not either.

## Setting a launch date

Set `date` to a real ISO date once one is officially announced (e.g. `"2026-03-15"`). Leaving it empty always shows "To be announced" (`TGE_NOT_ANNOUNCED_MESSAGE`). **Never generate a countdown from this value** — none of the Agent Hub components read `date` to build a timer; if a countdown is added later, gate it on `status === "scheduled"` and a real, confirmed `date`, not on the field simply being non-empty.

## Enabling claims via a contract

1. Deploy the claim contract and set `VITE_PULSE_CLAIM_CONTRACT` (see `docs/AGENT_CONTRACT_INTEGRATION.md`).
2. Implement `PulseClaimAdapter` against the real contract, replacing `unconfiguredClaimAdapter`.
3. Set `tgeConfig.distributionMode = "contract-claim"`.
4. Once TGE has genuinely occurred and the claim contract is live, set `status = "claim-live"` and `claimEnabled = true`.

Until all four steps are done, every claim button shows "TGE Not Live" or "Claim Not Enabled" and stays disabled — see `src/lib/agent-hub/deriveClaimButtonState.ts` for the exact state machine.

## Manual distribution instead of a contract

See `docs/MANUAL_DISTRIBUTION.md`.
