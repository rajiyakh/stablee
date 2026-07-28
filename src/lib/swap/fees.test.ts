import { describe, expect, it } from "vitest";
import { computeSwapFeeBps, FEE_BPS_MAX, selectFeeToken } from "./fees";
import { USDG_ADDRESS, WETH_ADDRESS } from "@/config/swapTokens";

describe("computeSwapFeeBps", () => {
  it("defaults to 100 bps when no override is given", () => {
    expect(computeSwapFeeBps()).toBe(100);
  });

  it("clamps to the 100 bps ceiling even if a caller asks for more", () => {
    expect(computeSwapFeeBps(1000)).toBe(FEE_BPS_MAX);
    expect(computeSwapFeeBps(101)).toBe(FEE_BPS_MAX);
  });

  it("clamps negative values to 0", () => {
    expect(computeSwapFeeBps(-5)).toBe(0);
  });

  it("falls back to the default for non-finite input", () => {
    expect(computeSwapFeeBps(Number.NaN)).toBe(100);
  });
});

describe("selectFeeToken priority order", () => {
  const RANDOM_TOKEN_A = "0x1111111111111111111111111111111111aaaa";
  const RANDOM_TOKEN_B = "0x2222222222222222222222222222222222bbbb";

  it("picks USDG when it's the sell token", () => {
    expect(selectFeeToken(USDG_ADDRESS, RANDOM_TOKEN_A)).toBe(USDG_ADDRESS);
  });

  it("picks USDG when it's the buy token", () => {
    expect(selectFeeToken(RANDOM_TOKEN_A, USDG_ADDRESS)).toBe(USDG_ADDRESS);
  });

  it("falls back to buyToken when neither side is a stablecoin", () => {
    expect(selectFeeToken(WETH_ADDRESS, RANDOM_TOKEN_B)).toBe(RANDOM_TOKEN_B);
  });

  it("is case-insensitive when matching USDG", () => {
    expect(selectFeeToken(USDG_ADDRESS.toUpperCase(), RANDOM_TOKEN_A)).toBe(
      USDG_ADDRESS.toUpperCase(),
    );
  });
});
