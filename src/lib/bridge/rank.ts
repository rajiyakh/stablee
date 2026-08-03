import type { BridgeSortMode, NormalizedBridgeQuote } from "./types";

function totalInputCost(quote: NormalizedBridgeQuote): bigint {
  return BigInt(quote.providerFeeAmount || "0") + BigInt(quote.platformFeeAmount || "0");
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
  const aOut = BigInt(a.estimatedOutputAmount || "0");
  const bOut = BigInt(b.estimatedOutputAmount || "0");
  if (aOut !== bOut) return aOut > bOut ? -1 : 1;

  if (a.gasCostUsd !== null && b.gasCostUsd !== null && a.gasCostUsd !== b.gasCostUsd) {
    return a.gasCostUsd - b.gasCostUsd;
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

  const aGas = a.gasCostUsd;
  const bGas = b.gasCostUsd;
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
