import { formatUnits, parseUnits } from "viem";
import { pulseTokenDecimals } from "@/config/genesisAgents";

const SECONDS_PER_DAY = 86400n;

/**
 * pending = elapsedActiveSeconds × dailyRate ÷ 86400, computed entirely in
 * BigInt base units — never JavaScript floating point — matching this
 * codebase's existing convention for token amounts (see src/lib/swap/decimals.test.ts).
 * Returns base units so multiple positions can be summed exactly before a
 * single final formatUnits() call (see sumPendingAllocationBaseUnits).
 */
export function calculatePendingAllocationBaseUnits(
  elapsedActiveSeconds: number,
  dailyRate: string,
  decimals: number = pulseTokenDecimals,
): bigint {
  if (elapsedActiveSeconds <= 0) return 0n;
  const dailyRateBaseUnits = parseUnits(dailyRate, decimals);
  const elapsedSecondsBigint = BigInt(Math.floor(elapsedActiveSeconds));
  return (dailyRateBaseUnits * elapsedSecondsBigint) / SECONDS_PER_DAY;
}

/** Display-formatted convenience wrapper around calculatePendingAllocationBaseUnits. */
export function calculatePendingAllocation(
  elapsedActiveSeconds: number,
  dailyRate: string,
  decimals: number = pulseTokenDecimals,
): string {
  return formatUnits(
    calculatePendingAllocationBaseUnits(elapsedActiveSeconds, dailyRate, decimals),
    decimals,
  );
}

/** Sums base-unit amounts across positions — always sum before formatting, never sum formatted decimal strings. */
export function sumPendingAllocationBaseUnits(amounts: bigint[]): bigint {
  return amounts.reduce((total, amount) => total + amount, 0n);
}
