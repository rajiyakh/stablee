import { describe, expect, it } from "vitest";
import {
  calculatePendingAllocation,
  calculatePendingAllocationBaseUnits,
  sumPendingAllocationBaseUnits,
} from "./calculatePendingAllocation";

describe("calculatePendingAllocation", () => {
  it("computes exactly one day of accrual at the daily rate", () => {
    expect(calculatePendingAllocation(86400, "1")).toBe("1");
  });

  it("computes a fraction of a day proportionally", () => {
    expect(calculatePendingAllocation(43200, "2")).toBe("1");
  });

  it("returns 0 for zero or negative elapsed seconds", () => {
    expect(calculatePendingAllocation(0, "20")).toBe("0");
    expect(calculatePendingAllocation(-100, "20")).toBe("0");
  });

  it("handles the highest-tier agent's rate (Oracle: 4000 $PULSE/day) without precision loss", () => {
    expect(calculatePendingAllocation(86400 * 10, "4000")).toBe("40000");
  });

  it("does not lose precision on a long-running farming position (weeks of accrual)", () => {
    const oneWeekSeconds = 86400 * 7;
    // Atlas: 1500 $PULSE/day for a full week
    const result = calculatePendingAllocationBaseUnits(oneWeekSeconds, "1500", 18);
    expect(result).toBe(10_500_000_000_000_000_000_000n);
  });
});

describe("sumPendingAllocationBaseUnits — multiple owned Agents", () => {
  it("sums several positions' base-unit amounts exactly, without float rounding", () => {
    const positions = [
      calculatePendingAllocationBaseUnits(86400, "75", 18), // Vector: 75/day
      calculatePendingAllocationBaseUnits(86400, "900", 18), // Ledger: 900/day
      calculatePendingAllocationBaseUnits(86400, "4000", 18), // Oracle: 4000/day
    ];
    const total = sumPendingAllocationBaseUnits(positions);
    expect(total).toBe(4_975_000_000_000_000_000_000n);
  });

  it("returns 0n for an empty list of positions", () => {
    expect(sumPendingAllocationBaseUnits([])).toBe(0n);
  });
});
