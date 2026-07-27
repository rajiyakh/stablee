/**
 * 0x's v2 response has no price-impact field. This computes it from two
 * independently-resolved USD values (sell side vs. buy side) rather than
 * inventing a number — if either side couldn't be priced, returns null and
 * callers must show "unavailable," never a fabricated percentage.
 */
export function computePriceImpactBps(
  sellUsd: number | null,
  buyUsd: number | null,
): number | null {
  if (sellUsd === null || buyUsd === null) return null;
  if (!Number.isFinite(sellUsd) || !Number.isFinite(buyUsd) || sellUsd <= 0) return null;

  const impact = 1 - buyUsd / sellUsd;
  return Math.round(impact * 10_000);
}
