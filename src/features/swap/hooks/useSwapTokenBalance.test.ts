import { describe, expect, it } from "vitest";
import { computeMaxSellFormatted, isNativeSwapToken } from "./useSwapTokenBalance";
import { NATIVE_GAS_RESERVE_WEI, NATIVE_SENTINEL } from "@/config/swapTokens";

describe("isNativeSwapToken", () => {
  it("matches the native sentinel address case-insensitively", () => {
    expect(isNativeSwapToken({ address: NATIVE_SENTINEL.toLowerCase() } as never)).toBe(true);
    expect(isNativeSwapToken({ address: NATIVE_SENTINEL } as never)).toBe(true);
  });

  it("returns false for an ERC-20 token address", () => {
    expect(
      isNativeSwapToken({ address: "0x0bd7d308f8e1639fab988df18a8011f41eacad73" } as never),
    ).toBe(false);
  });

  it("returns false for null", () => {
    expect(isNativeSwapToken(null)).toBe(false);
  });
});

describe("computeMaxSellFormatted", () => {
  it("returns null when balance hasn't loaded", () => {
    expect(computeMaxSellFormatted(undefined, 18, true)).toBeNull();
  });

  it("returns the true full balance for an ERC-20 sell (gas paid separately)", () => {
    const value = 5_000_000_000_000_000_000n; // 5 tokens
    expect(computeMaxSellFormatted(value, 18, false)).toBe("5");
  });

  it("subtracts the gas reserve for a native-ETH sell", () => {
    const value = 5_000_000_000_000_000_000n; // 5 ETH
    const expected = value - NATIVE_GAS_RESERVE_WEI;
    expect(computeMaxSellFormatted(value, 18, true)).toBe((Number(expected) / 1e18).toString());
  });

  it("never returns a negative max — floors at 0 when balance is below the gas reserve", () => {
    const value = NATIVE_GAS_RESERVE_WEI / 2n; // less than the reserve
    expect(computeMaxSellFormatted(value, 18, true)).toBe("0");
  });

  it("floors at 0 exactly at the reserve boundary", () => {
    expect(computeMaxSellFormatted(NATIVE_GAS_RESERVE_WEI, 18, true)).toBe("0");
  });
});
