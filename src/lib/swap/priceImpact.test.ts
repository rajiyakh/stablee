import { describe, expect, it } from "vitest";
import { computePriceImpactBps } from "./priceImpact";

describe("computePriceImpactBps", () => {
  it("returns null when the sell-side USD value is unavailable", () => {
    expect(computePriceImpactBps(null, 100)).toBeNull();
  });

  it("returns null when the buy-side USD value is unavailable", () => {
    expect(computePriceImpactBps(100, null)).toBeNull();
  });

  it("computes 0 bps for a lossless trade", () => {
    expect(computePriceImpactBps(100, 100)).toBe(0);
  });

  it("computes a positive impact when the buy side is worth less than the sell side", () => {
    // Sell $100 worth, receive $97 worth -> 3% impact = 300 bps
    expect(computePriceImpactBps(100, 97)).toBe(300);
  });

  it("handles very large amounts without precision blowing up", () => {
    // 1% impact on a billion-dollar-scale trade = 100 bps
    expect(computePriceImpactBps(1_000_000_000, 990_000_000)).toBe(100);
  });

  it("returns null for a zero or negative sell value", () => {
    expect(computePriceImpactBps(0, 10)).toBeNull();
    expect(computePriceImpactBps(-5, 10)).toBeNull();
  });
});
