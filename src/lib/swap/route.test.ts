import { describe, expect, it } from "vitest";
import { humanizeRouteSources } from "./route";

describe("humanizeRouteSources", () => {
  it("returns null when route is undefined", () => {
    expect(humanizeRouteSources(undefined)).toBeNull();
  });

  it("returns null when fills is empty", () => {
    expect(humanizeRouteSources({ fills: [] })).toBeNull();
  });

  it("humanizes a single source", () => {
    expect(humanizeRouteSources({ fills: [{ source: "Uniswap_V3" }] })).toBe("Uniswap V3");
  });

  it("joins distinct sources for a split route", () => {
    expect(
      humanizeRouteSources({
        fills: [{ source: "Uniswap_V3" }, { source: "LiquidCore" }],
      }),
    ).toBe("Uniswap V3 + LiquidCore");
  });

  it("de-duplicates repeated sources across multiple fills", () => {
    expect(
      humanizeRouteSources({
        fills: [{ source: "Uniswap_V3" }, { source: "Uniswap_V3" }],
      }),
    ).toBe("Uniswap V3");
  });

  it("ignores fills with no source", () => {
    expect(humanizeRouteSources({ fills: [{}, { source: "LiquidCore" }] })).toBe("LiquidCore");
  });
});
