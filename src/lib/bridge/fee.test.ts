import { describe, expect, it } from "vitest";
import {
  BRIDGE_FEE_BPS_MAX,
  checkPlatformFee,
  computeBridgeFeeBps,
  expectedPlatformFee,
  safeBigInt,
} from "./fee";

describe("computeBridgeFeeBps", () => {
  it("defaults to 100 bps (1%) when no override is given", () => {
    expect(computeBridgeFeeBps()).toBe(100);
  });

  it("clamps to the 100 bps ceiling even if a caller asks for more", () => {
    expect(computeBridgeFeeBps(500)).toBe(BRIDGE_FEE_BPS_MAX);
    expect(computeBridgeFeeBps(101)).toBe(BRIDGE_FEE_BPS_MAX);
  });

  it("clamps negative values to 0", () => {
    expect(computeBridgeFeeBps(-5)).toBe(0);
  });

  it("falls back to the default for non-finite input", () => {
    expect(computeBridgeFeeBps(Number.NaN)).toBe(100);
  });
});

describe("expectedPlatformFee", () => {
  it("computes an exact 1% at 6 decimals (USDC-style) with no float drift", () => {
    expect(expectedPlatformFee("1000000", 100)).toBe("10000");
  });

  it("computes an exact 1% at 18 decimals (ETH-style)", () => {
    expect(expectedPlatformFee("1000000000000000000", 100)).toBe("10000000000000000");
  });

  it("floors rather than rounds on an inexact division", () => {
    // 999 * 100 / 10000 = 9.99 -> floors to 9
    expect(expectedPlatformFee("999", 100)).toBe("9");
  });

  it("returns 0 when bps is 0", () => {
    expect(expectedPlatformFee("1000000", 0)).toBe("0");
  });
});

describe("checkPlatformFee", () => {
  it("returns null when the reported fee matches the expected amount", () => {
    const result = checkPlatformFee({ inputAmount: "1000000", platformFeeAmount: "10000" }, 100);
    expect(result).toBeNull();
  });

  it("returns null within tolerance of provider-side rounding", () => {
    const result = checkPlatformFee({ inputAmount: "1000000", platformFeeAmount: "10001" }, 100);
    expect(result).toBeNull();
  });

  it("flags fee_missing when a fee was expected but none was reported", () => {
    const result = checkPlatformFee({ inputAmount: "1000000", platformFeeAmount: "0" }, 100);
    expect(result).toEqual({ code: "fee_missing" });
  });

  it("does not flag fee_missing when no fee was expected at all (0 bps)", () => {
    const result = checkPlatformFee({ inputAmount: "1000000", platformFeeAmount: "0" }, 0);
    expect(result).toBeNull();
  });

  it("flags fee_mismatch when the fee is charged twice", () => {
    // expected 10000, provider reports 20000 (double) — far outside tolerance
    const result = checkPlatformFee({ inputAmount: "1000000", platformFeeAmount: "20000" }, 100);
    expect(result).toEqual({ code: "fee_mismatch", expected: "10000", actual: "20000" });
  });

  it("flags fee_mismatch when the fee is significantly under-reported", () => {
    const result = checkPlatformFee({ inputAmount: "1000000", platformFeeAmount: "1000" }, 100);
    expect(result).toEqual({ code: "fee_mismatch", expected: "10000", actual: "1000" });
  });

  it("flags invalid_fee_amount instead of throwing on a malformed inputAmount", () => {
    expect(() =>
      checkPlatformFee({ inputAmount: "1.5", platformFeeAmount: "10000" }, 100),
    ).not.toThrow();
    const result = checkPlatformFee({ inputAmount: "1.5", platformFeeAmount: "10000" }, 100);
    expect(result).toEqual({ code: "invalid_fee_amount" });
  });

  it("flags invalid_fee_amount instead of throwing on a malformed platformFeeAmount", () => {
    const result = checkPlatformFee({ inputAmount: "1000000", platformFeeAmount: "1e18" }, 100);
    expect(result).toEqual({ code: "invalid_fee_amount" });
  });

  it("flags invalid_fee_amount on an empty inputAmount rather than treating it as 0", () => {
    const result = checkPlatformFee({ inputAmount: "", platformFeeAmount: "0" }, 100);
    expect(result).toEqual({ code: "invalid_fee_amount" });
  });
});

describe("safeBigInt", () => {
  it("parses a well-formed base-unit integer string", () => {
    expect(safeBigInt("1000000")).toBe(1_000_000n);
  });

  it("returns null for a decimal string", () => {
    expect(safeBigInt("1.5")).toBeNull();
  });

  it("returns null for exponential notation", () => {
    expect(safeBigInt("1e18")).toBeNull();
  });

  it("returns null for an empty or missing value", () => {
    expect(safeBigInt("")).toBeNull();
    expect(safeBigInt(null)).toBeNull();
    expect(safeBigInt(undefined)).toBeNull();
  });

  it("never throws on non-numeric input", () => {
    expect(() => safeBigInt("not-a-number")).not.toThrow();
    expect(safeBigInt("not-a-number")).toBeNull();
  });
});
