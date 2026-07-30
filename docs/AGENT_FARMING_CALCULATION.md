# Agent Farming Calculation

The farming math lives at `src/lib/agent-hub/calculatePendingAllocation.ts` and `computeElapsedActiveSeconds.ts`. This is a **local display estimate only** — see `docs/AGENT_CONTRACT_INTEGRATION.md` for why client-side numbers are never authoritative once a real claim contract exists.

## The formula

```
pending = elapsedActiveSeconds × dailyRate ÷ 86400
```

Farming is displayed to users **exclusively as a daily rate** — never "Hourly Farming," "PULSE/hour," or "Hourly Rate." The formula itself still operates on elapsed seconds internally (accruing continuously, not in daily lump sums), so a position's pending balance still ticks up smoothly second-by-second — only the configured _rate_ and its label are daily now.

## Decimal safety

Every calculation happens in BigInt base units via viem's `parseUnits`/`formatUnits` against `pulseTokenDecimals` (`src/config/genesisAgents.ts`, currently `18`, editable once the real $PULSE token's decimals are known) — this app never uses JavaScript floating-point arithmetic for a final token amount, matching the existing convention in `src/lib/swap/decimals.test.ts`.

- `calculatePendingAllocationBaseUnits(elapsedActiveSeconds, dailyRate, decimals)` → `bigint`
- `calculatePendingAllocation(...)` → formatted decimal string, for display
- `sumPendingAllocationBaseUnits(amounts: bigint[])` → sums multiple positions in base-unit space. **Always sum before formatting** — never sum already-formatted decimal strings, which reintroduces float rounding.

## Elapsed-time model

`computeElapsedActiveSeconds(position, now)` only accrues time while `position.status` is `"farming"` or `"claimable"`, counting from `lastClaimedAt` (or `activatedAt` if never claimed) to `now`. `"preview"`, `"pending-activation"`, `"paused"`, and `"claimed"` positions accrue nothing further in this model.

**Known scoping limitation:** `OwnedAgentPosition` (the client-specified type) has no pause-history log — only a single `status` field. A paused position's already-accrued time simply freezes rather than being reconstructed from an unavailable pause timestamp. A real contract-backed system will most likely transition a position straight back to `"farming"` immediately after a successful claim (rather than staying `"claimed"` forever) — if a genuine pause/resume UX is built later, extend `OwnedAgentPosition` with a pause-history field rather than trying to infer it from `status` alone.

## Live-feeling display without polling

`src/hooks/usePendingAllocationTicker.ts` returns a locally-ticking `Date` — once per second normally, once per 30 seconds under `prefers-reduced-motion`, and paused entirely while the browser tab is hidden (`document.hidden`). It never makes a network or API request; it just re-triggers the same local calculation against the current time. `src/components/agent-hub/PendingAllocationCounter.tsx` combines this with `computeElapsedActiveSeconds`/`calculatePendingAllocation` and shows the required tooltip: "Estimated from the latest trusted farming snapshot. Final claimable allocation is determined by the official claim system."

## Local preview positions

`src/lib/agent-hub/localPreview.ts`'s `addPreviewAgent()` creates a position with `status: "farming"` and `activatedAt`/`acquiredAt` set to the current time, specifically so the ticking counter has something to demonstrate in a dev environment. These positions are never described as owned, minted, or on-chain anywhere in the UI — see `docs/AGENT_HUB_OVERVIEW.md` and the "Local Preview" badge (`PreviewDataBadge.tsx`).
