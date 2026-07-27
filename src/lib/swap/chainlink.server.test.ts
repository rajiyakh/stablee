import { describe, expect, it } from "vitest";
import { isFeedStale } from "./chainlink.server";

describe("isFeedStale", () => {
  it("is not stale well within a 24h-heartbeat feed's window", () => {
    // Observed live: AAPL/BABA sat 92 minutes (5520s) since last update on a
    // healthy 86400s-heartbeat feed. Must not be flagged stale.
    expect(isFeedStale(5520, 86400)).toBe(false);
  });

  it("is not stale right at the heartbeat boundary", () => {
    expect(isFeedStale(86400, 86400)).toBe(false);
  });

  it("is not stale within the 2x heartbeat grace margin", () => {
    expect(isFeedStale(86400 * 1.9, 86400)).toBe(false);
  });

  it("is stale beyond 2x the heartbeat", () => {
    expect(isFeedStale(86400 * 2.1, 86400)).toBe(true);
  });

  it("scales correctly for a much shorter heartbeat", () => {
    expect(isFeedStale(3600, 1800)).toBe(false); // exactly 2x 1800s
    expect(isFeedStale(3601, 1800)).toBe(true); // just past 2x
  });
});
