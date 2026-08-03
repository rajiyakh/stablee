import { describe, expect, it } from "vitest";
import { isChartEligible } from "./SwapTokenChart";
import { NATIVE_SENTINEL, type SwapTokenConfig } from "@/config/swapTokens";

function token(overrides: Partial<SwapTokenConfig>): SwapTokenConfig {
  return {
    address: "0x1",
    symbol: "TOK",
    name: "Token",
    decimals: 18,
    verified: true,
    ...overrides,
  };
}

describe("isChartEligible", () => {
  it("returns false for null", () => {
    expect(isChartEligible(null)).toBe(false);
  });

  it("returns false for the native sentinel address", () => {
    expect(isChartEligible(token({ address: NATIVE_SENTINEL, symbol: "ETH" }))).toBe(false);
  });

  it("returns false for WETH", () => {
    expect(isChartEligible(token({ address: "0xweth", symbol: "WETH" }))).toBe(false);
  });

  it("returns false for a stablecoin", () => {
    expect(isChartEligible(token({ symbol: "USDG", isStablecoin: true }))).toBe(false);
  });

  it("returns false for BTC-symbol tokens case-insensitively", () => {
    expect(isChartEligible(token({ symbol: "btc" }))).toBe(false);
    expect(isChartEligible(token({ symbol: "WBTC" }))).toBe(false);
  });

  it("returns true for an ordinary token", () => {
    expect(isChartEligible(token({ symbol: "PEPE" }))).toBe(true);
  });
});
