import type { OwnedAgentPosition } from "./types";

/**
 * How many seconds a position has been actively farming since its last
 * claim (or since activation, if never claimed).
 *
 * Only "farming" and "claimable" statuses accrue time — "preview" and
 * "pending-activation" haven't started, "paused" and "claimed" don't accrue
 * further in this pre-integration model. The client-provided OwnedAgentPosition
 * type has no pause-history log, so a paused position's elapsed time simply
 * freezes rather than being reconstructed from an unavailable timestamp; a
 * real contract-backed system will resume "farming" immediately after a
 * successful claim rather than staying "claimed" forever — see
 * docs/AGENT_FARMING_CALCULATION.md.
 */
export function computeElapsedActiveSeconds(
  position: Pick<OwnedAgentPosition, "activatedAt" | "lastClaimedAt" | "status">,
  now: Date = new Date(),
): number {
  if (position.status !== "farming" && position.status !== "claimable") return 0;

  const referenceIso = position.lastClaimedAt ?? position.activatedAt;
  const referenceMs = Date.parse(referenceIso);
  if (Number.isNaN(referenceMs)) return 0;

  const elapsedMs = now.getTime() - referenceMs;
  return elapsedMs > 0 ? Math.floor(elapsedMs / 1000) : 0;
}
