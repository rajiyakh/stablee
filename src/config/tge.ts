/**
 * TGE (Token Generation Event) and $PULSE claim status.
 *
 * Never invent a launch date or claim status — the UI shows "To be
 * announced" and disables claim affordances until the owner fills these in.
 * No countdown is ever generated from an empty date. See docs/PULSE_CLAIM_SETUP.md
 * and docs/MANUAL_DISTRIBUTION.md for how to change these values.
 */

export type TgeStatus =
  | "not-announced"
  | "scheduled"
  | "farming-active"
  | "tge-complete"
  | "claim-live"
  | "distribution-pending"
  | "distribution-complete";

export type PulseDistributionMode = "contract-claim" | "manual-distribution" | "not-decided";

export const tgeConfig = {
  status: "not-announced" as TgeStatus,
  date: "",
  claimEnabled: false,
  distributionMode: "not-decided" as PulseDistributionMode,
  announcementUrl: "",
} as const;

export type TgeConfig = typeof tgeConfig;

export const TGE_NOT_ANNOUNCED_MESSAGE = "To be announced";

export const MANUAL_DISTRIBUTION_MESSAGE =
  "Eligible allocations will be distributed after TGE according to the official RobinPulse distribution process.";

/** Claiming is only ever possible once BOTH the TGE has happened and the claim mechanism is explicitly enabled. */
export function isClaimLive(): boolean {
  return tgeConfig.status === "claim-live" && tgeConfig.claimEnabled;
}
