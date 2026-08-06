import { safeBigInt } from "./fee";
import type { BridgeSortMode, NormalizedBridgeQuote } from "./types";

/** Malformed provider-supplied amount strings fail closed to 0 here — by
 * this point the quote has already passed validateBridgeQuote(), which
 * rejects malformed amounts outright, so this is only a defense-in-depth
 * guard against ranking being called directly (e.g. in tests) with
 * unvalidated input. */
function safeAmount(value: string | null | undefined): bigint {
  return safeBigInt(value) ?? 0n;
}

function totalInputCost(quote: NormalizedBridgeQuote): bigint {
  return safeAmount(quote.providerFeeAmount) + safeAmount(quote.platformFeeAmount);
}

/** Treats a non-finite gasCostUsd (shouldn't happen post-normalize.ts's own
 * guard, but comparators must never assume upstream data is clean) the same
 * as "not reported" — never let NaN silently break the sort's total order. */
function finiteOrNull(value: number | null): number | null {
  return value !== null && Number.isFinite(value) ? value : null;
}

/**
 * All quotes in a single ranking pass are for the same destination token
 * (one BridgeQuoteParams per request), so estimatedOutputAmount and
 * minimumReceived are directly BigInt-comparable — no float conversion, no
 * cross-token USD dependency needed for the primary sort.
 */
/**
 * Primary metric is estimatedOutputAmount descending — the actual amount
 * received, already net of provider fee + platform fee. Gas is only ever
 * used as a tie-break, and only when BOTH quotes being compared report it
 * (never a partial/unfair mix, since a missing gasCostUsd on one side would
 * otherwise silently favor whichever quote happens not to report it).
 */
function compareBestReturn(a: NormalizedBridgeQuote, b: NormalizedBridgeQuote): number {
  const aOut = safeAmount(a.estimatedOutputAmount);
  const bOut = safeAmount(b.estimatedOutputAmount);
  if (aOut !== bOut) return aOut > bOut ? -1 : 1;

  const aGas = finiteOrNull(a.gasCostUsd);
  const bGas = finiteOrNull(b.gasCostUsd);
  if (aGas !== null && bGas !== null && aGas !== bGas) {
    return aGas - bGas;
  }

  const aTime = a.estimatedTimeSeconds;
  const bTime = b.estimatedTimeSeconds;
  if (aTime === null && bTime === null) return 0;
  if (aTime === null) return 1;
  if (bTime === null) return -1;
  return aTime - bTime;
}

function compareFastest(a: NormalizedBridgeQuote, b: NormalizedBridgeQuote): number {
  const aTime = a.estimatedTimeSeconds;
  const bTime = b.estimatedTimeSeconds;
  if (aTime === null && bTime === null) return compareBestReturn(a, b);
  if (aTime === null) return 1; // unknown is never "fast" — always last
  if (bTime === null) return -1;
  if (aTime !== bTime) return aTime - bTime;
  return compareBestReturn(a, b);
}

function compareLowestCost(a: NormalizedBridgeQuote, b: NormalizedBridgeQuote): number {
  const aCost = totalInputCost(a);
  const bCost = totalInputCost(b);
  if (aCost !== bCost) return aCost > bCost ? 1 : -1;

  const aGas = finiteOrNull(a.gasCostUsd);
  const bGas = finiteOrNull(b.gasCostUsd);
  if (aGas === null && bGas === null) return 0;
  if (aGas === null) return 1;
  if (bGas === null) return -1;
  return aGas - bGas;
}

export function rankRoutes(
  quotes: NormalizedBridgeQuote[],
  sort: BridgeSortMode,
): NormalizedBridgeQuote[] {
  const comparator =
    sort === "fastest"
      ? compareFastest
      : sort === "lowestCost"
        ? compareLowestCost
        : compareBestReturn;
  return [...quotes].sort(comparator);
}
