/**
 * New-launch detection configuration.
 *
 * A token is only ever classified as "new" when a real, provider-reported
 * pair-creation timestamp exists (`requireProviderPairTimestamp`). Thresholds
 * below are deliberately conservative and easy to edit.
 */
export const newLaunchConfig = {
  enabled: true,

  /** A token counts as newly launched if its real pair age is under this many minutes. */
  recentLaunchWindowMinutes: 180,

  minimumLiquidityUsd: 3_000,
  minimumTransactions5m: 4,
  minimumVolume5mUsd: 1_500,

  requireProviderPairTimestamp: true,

  showLowLiquidityLaunches: true,
  markUnverifiedContracts: true,
} as const;

/** Windows offered in the "New Launches" filter UI. */
export const newLaunchWindows = [
  { label: "Last 15 minutes", minutes: 15 },
  { label: "Last 30 minutes", minutes: 30 },
  { label: "Last 1 hour", minutes: 60 },
  { label: "Last 6 hours", minutes: 360 },
  { label: "Last 24 hours", minutes: 1440 },
] as const;
