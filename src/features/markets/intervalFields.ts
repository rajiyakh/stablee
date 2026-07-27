import type { GmgnInterval, RobinhoodTrendingToken } from "@/types/gmgn";

/**
 * Reads whichever interval-specific field matches the currently selected
 * interval. Never falls back to a different interval's value — a column
 * showing "24h volume" must never silently display 1h data.
 */
export function intervalVolume(
  token: RobinhoodTrendingToken,
  interval: GmgnInterval,
): number | undefined {
  switch (interval) {
    case "1m":
      return token.volume1mUsd;
    case "5m":
      return token.volume5mUsd;
    case "1h":
      return token.volume1hUsd;
    case "6h":
      return token.volume6hUsd;
    case "24h":
      return token.volume24hUsd;
  }
}

export function intervalTransactions(
  token: RobinhoodTrendingToken,
  interval: GmgnInterval,
): number | undefined {
  switch (interval) {
    case "1m":
      return token.transactions1m;
    case "5m":
      return token.transactions5m;
    case "1h":
      return token.transactions1h;
    case "6h":
      return token.transactions6h;
    case "24h":
      return token.transactions24h;
  }
}

export function intervalPriceChange(
  token: RobinhoodTrendingToken,
  interval: GmgnInterval,
): number | undefined {
  switch (interval) {
    case "1m":
      return token.priceChange1m;
    case "5m":
      return token.priceChange5m;
    case "1h":
      return token.priceChange1h;
    case "6h":
      return token.priceChange6h;
    case "24h":
      return token.priceChange24h;
  }
}

/** GMGN's raw item only ever carries one generic buys/sells pair per call; only 1m/1h calls populate it. */
export function intervalBuys(
  token: RobinhoodTrendingToken,
  interval: GmgnInterval,
): number | undefined {
  if (interval === "1m") return token.buys1m;
  if (interval === "1h") return token.buys1h;
  return undefined;
}

export function intervalSells(
  token: RobinhoodTrendingToken,
  interval: GmgnInterval,
): number | undefined {
  if (interval === "1m") return token.sells1m;
  if (interval === "1h") return token.sells1h;
  return undefined;
}
