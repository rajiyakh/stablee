import { describe, expect, it } from "vitest";
import { formatUnits, parseUnits } from "viem";

/**
 * This app never uses JavaScript floating-point arithmetic on token base
 * units — every amount that crosses the wallet boundary goes through viem's
 * BigInt-based parseUnits/formatUnits. These tests exercise the exact edge
 * cases the spec calls out (very large amounts, very low-value tokens,
 * differing decimals) against the real library, not hand-rolled math.
 */
describe("BigInt-safe token amount math", () => {
  it("round-trips a very large 18-decimal amount without precision loss", () => {
    const amount = "123456789.123456789012345678";
    const base = parseUnits(amount, 18);
    expect(base).toBe(123456789123456789012345678n);
    expect(formatUnits(base, 18)).toBe(amount);
  });

  it("round-trips a tiny amount of a low-price, high-decimal token", () => {
    // e.g. a token worth $0.0000001 — 0.000000000001 units at 18 decimals
    const base = parseUnits("0.000000000001", 18);
    expect(base).toBe(1_000_000n);
    expect(formatUnits(base, 18)).toBe("0.000000000001");
  });

  it("handles a 6-decimal stablecoin (USDG) correctly", () => {
    const base = parseUnits("20", 6);
    expect(base).toBe(20_000_000n);
    expect(formatUnits(base, 6)).toBe("20");
  });

  it("does not lose precision on amounts too large for a JS float", () => {
    // 2^53 - 1 is the largest safely-representable integer in a JS number.
    // A whale-sized 18-decimal amount blows well past that as a float.
    const amount = "9007199254.740993"; // deliberately > Number.MAX_SAFE_INTEGER once scaled
    const base = parseUnits(amount, 18);
    expect(base.toString()).toBe("9007199254740993000000000000");
    expect(formatUnits(base, 18)).toBe(amount);
  });

  it("throws rather than silently truncating on a malformed amount string", () => {
    expect(() => parseUnits("not-a-number", 18)).toThrow();
  });
});
