# Manual Distribution

The owner may choose to distribute $PULSE manually after TGE instead of deploying an on-chain claim contract. This is a first-class, equally-supported mode — set `tgeConfig.distributionMode` (`src/config/tge.ts`) to one of:

```ts
export type PulseDistributionMode = "contract-claim" | "manual-distribution" | "not-decided";
```

Default: `"not-decided"`.

## What changes in manual-distribution mode

- `src/lib/agent-hub/deriveClaimButtonState.ts` returns `"distribution-pending"` before any of the other claim checks run — no clickable Claim button is ever shown in this mode, regardless of TGE status or wallet connection.
- `src/lib/agent-hub/unconfiguredClaimAdapter.ts`'s `getClaimStatus()`/`prepareClaim()` both short-circuit to the exact required copy: "Eligible allocations will be distributed after TGE according to the official RobinPulse distribution process." (`MANUAL_DISTRIBUTION_MESSAGE`, exported from `src/config/tge.ts`).

## Switching to manual distribution

Set `tgeConfig.distributionMode = "manual-distribution"`. No further code changes are required — every claim-related UI surface already reads this field.

## Reporting / export tooling

The spec anticipates a future export/report function for the owner to determine who receives what allocation. **This is not built** — no admin allocation export exists in this codebase, and none should be added without a deliberate, separately-reviewed design (who can access it, how positions are attributed, what data it exposes). Do not wire a public-facing export of per-wallet allocation data as a side effect of implementing manual distribution.

## Switching back to a contract claim later

Set `distributionMode` back to `"contract-claim"` and follow the steps in `docs/PULSE_CLAIM_SETUP.md`. The two modes are mutually exclusive in the UI (only one claim-button code path is ever active), so there's no risk of both a manual process and a live claim button being shown simultaneously.
