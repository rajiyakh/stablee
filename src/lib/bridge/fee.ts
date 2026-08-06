import type { NormalizedBridgeQuote } from "./types";

/**
 * Pure, client-safe fee math — no env reads here, same split as
 * src/lib/swap/fees.ts. The server-side env-configurable override lives in
 * feeConfig.server.ts.
 */
export const BRIDGE_FEE_BPS_DEFAULT = 100; // 1%, per spec
/** Hardcoded safety ceiling — never raised by an env var, only lowered/set below it. */
export const BRIDGE_FEE_BPS_MAX = 100;
/** Rounding slack against provider-side math when reading their fee back. */
export const FEE_TOLERANCE_BPS = 2;

/** Clamps to [0, BRIDGE_FEE_BPS_MAX] — a caller can never push the fee above the hardcoded cap. */
export function computeBridgeFeeBps(overrideBps?: number): number {
  const raw = overrideBps ?? BRIDGE_FEE_BPS_DEFAULT;
  if (!Number.isFinite(raw)) return BRIDGE_FEE_BPS_DEFAULT;
  return Math.max(0, Math.min(BRIDGE_FEE_BPS_MAX, raw));
}

/**
 * Parses a token-amount string the way every amount on a NormalizedBridgeQuote
 * is expected to look — a plain non-negative integer in base units. Provider
 * responses are external input we don't fully control, so a malformed value
 * ("1.5", "1e18", "", non-numeric) fails closed to null instead of throwing
 * out of BigInt() and crashing whatever called this.
 */
export function safeBigInt(value: string | null | undefined): bigint | null {
  if (!value || !/^\d+$/.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

/**
 * BigInt floor math — no floats anywhere near token amounts. Used only to
 * (a) build the outbound provider fee parameter and (b) check what a
 * provider reports against, never to compute a number the user is charged.
 * A malformed inputAmount degrades to a 0 expected fee here — checkPlatformFee
 * itself independently rejects a malformed inputAmount via safeBigInt before
 * ever reaching this, so that degrade path is only ever hit by direct callers
 * building the outbound request param, where 0 is an acceptable fallback.
 */
export function expectedPlatformFee(inputAmount: string, bps: number): string {
  const amount = safeBigInt(inputAmount) ?? 0n;
  const feeBps = BigInt(Math.max(0, Math.trunc(bps)));
  return ((amount * feeBps) / 10_000n).toString();
}

export type PlatformFeeCheck =
  | { code: "fee_missing" }
  | { code: "fee_mismatch"; expected: string; actual: string }
  | { code: "invalid_fee_amount" }
  | null;

/**
 * The double-fee gate. platformFeeAmount on a NormalizedBridgeQuote is only
 * ever populated by reading it back out of the provider's own parsed
 * response (see each providers/*.server.ts adapter + normalize.ts) — this
 * function never derives the number charged, it only verifies the provider
 * reported charging something consistent with what we asked for.
 *
 * invalid_fee_amount: inputAmount or platformFeeAmount isn't a well-formed
 * base-unit integer string — never guess at what a malformed provider
 * response meant, exclude the route instead.
 *
 * fee_missing: feeMode is provider-native but the provider reported no fee
 * — never treat that as "fee collected", exclude the route instead.
 *
 * fee_mismatch: the reported fee deviates from the expected amount by more
 * than FEE_TOLERANCE_BPS — catches overcharging AND a fee applied twice
 * (a doubled 1% fee is ~100bps off expected, far outside a 2bps tolerance).
 */
export function checkPlatformFee(
  quote: Pick<NormalizedBridgeQuote, "inputAmount" | "platformFeeAmount">,
  expectedBps: number,
): PlatformFeeCheck {
  const inputAmountNum = safeBigInt(quote.inputAmount);
  const actualNum = safeBigInt(quote.platformFeeAmount || "0");
  if (inputAmountNum === null || actualNum === null) {
    return { code: "invalid_fee_amount" };
  }

  const feeBps = BigInt(Math.max(0, Math.trunc(expectedBps)));
  const expectedNum = (inputAmountNum * feeBps) / 10_000n;
  const expected = expectedNum.toString();
  const actual = actualNum.toString();

  if (expectedNum > 0n && actualNum === 0n) {
    return { code: "fee_missing" };
  }

  const diff = actualNum > expectedNum ? actualNum - expectedNum : expectedNum - actualNum;
  const toleranceNum = (inputAmountNum * BigInt(FEE_TOLERANCE_BPS)) / 10_000n;

  if (diff > toleranceNum) {
    return { code: "fee_mismatch", expected, actual };
  }

  return null;
}
