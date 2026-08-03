import { describe, expect, it } from "vitest";
import { ALLOCATION, GENESIS_AGENTS } from "./tokenomics";

describe("tokenomics config", () => {
  it("allocation percentages sum to exactly 100", () => {
    const total = ALLOCATION.reduce((sum, category) => sum + category.percent, 0);
    expect(total).toBe(100);
  });

  it("has exactly six Genesis Agent Farming agents", () => {
    expect(GENESIS_AGENTS).toHaveLength(6);
  });

  it("every allocation category has at least one item", () => {
    for (const category of ALLOCATION) {
      expect(category.items.length).toBeGreaterThan(0);
    }
  });
});
