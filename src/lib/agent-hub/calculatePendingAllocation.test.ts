import { describe, expect, it } from "vitest";
import {
  calculatePendingAllocation,
  calculatePendingAllocationBaseUnits,
  sumPendingAllocationBaseUnits,
} from "./calculatePendingAllocation";

describe("calculatePendingAllocation", () => {
  it("computes exactly one hour of accrual at the hourly rate", () => {
    expect(calculatePendingAllocation(3600, "1")).toBe("1");
  });

  it("computes a fraction of an hour proportionally", () => {
    expect(calculatePendingAllocation(1800, "2")).toBe("1");
  });

  it("returns 0 for zero or negative elapsed seconds", () => {
    expect(calculatePendingAllocation(0, "20")).toBe("0");
    expect(calculatePendingAllocation(-100, "20")).toBe("0");
  });

  it("handles the highest-tier agent's rate (Oracle: 20 $PULSE/hr) without precision loss", () => {
    expect(calculatePendingAllocation(3600 * 10, "20")).toBe("200");
  });

  it("does not lose precision on a long-running farming position (weeks of accrual)", () => {
    const oneWeekSeconds = 3600 * 24 * 7;
    // 7 $PULSE/hr for a full week
    const result = calculatePendingAllocationBaseUnits(oneWeekSeconds, "7", 18);
    expect(result).toBe(1176000000000000000000n);
  });
});

describe("sumPendingAllocationBaseUnits — multiple owned Agents", () => {
  it("sums several positions' base-unit amounts exactly, without float rounding", () => {
    const positions = [
      calculatePendingAllocationBaseUnits(3600, "1", 18), // Vector: 1
      calculatePendingAllocationBaseUnits(3600, "4", 18), // Ledger: 4
      calculatePendingAllocationBaseUnits(3600, "20", 18), // Oracle: 20
    ];
    const total = sumPendingAllocationBaseUnits(positions);
    expect(total).toBe(25_000_000_000_000_000_000n);
  });

  it("returns 0n for an empty list of positions", () => {
    expect(sumPendingAllocationBaseUnits([])).toBe(0n);
  });
});
