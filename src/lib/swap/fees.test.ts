import { describe, expect, it } from "vitest";
import {
  computeSwapFeeBps,
  FEE_BPS_MAX,
  meetsMinimumFee,
  meetsMinimumSwap,
  selectFeeToken,
} from "./fees";
import { USDG_ADDRESS, WETH_ADDRESS } from "@/config/swapTokens";

describe("computeSwapFeeBps", () => {
  it("defaults to 10 bps when no override is given", () => {
    expect(computeSwapFeeBps()).toBe(10);
  });

  it("clamps to the 30 bps ceiling even if a caller asks for more", () => {
    expect(computeSwapFeeBps(1000)).toBe(FEE_BPS_MAX);
    expect(computeSwapFeeBps(31)).toBe(FEE_BPS_MAX);
  });

  it("clamps negative values to 0", () => {
    expect(computeSwapFeeBps(-5)).toBe(0);
  });

  it("falls back to the default for non-finite input", () => {
    expect(computeSwapFeeBps(Number.NaN)).toBe(10);
  });
});

describe("meetsMinimumSwap ($20 boundary)", () => {
  it("rejects $19.99", () => {
    expect(meetsMinimumSwap(19.99)).toBe(false);
  });

  it("accepts exactly $20", () => {
    expect(meetsMinimumSwap(20)).toBe(true);
  });

  it("accepts values above $20", () => {
    expect(meetsMinimumSwap(20.01)).toBe(true);
    expect(meetsMinimumSwap(1000)).toBe(true);
  });

  it("rejects when USD value is unknown (null) — never assumes safe", () => {
    expect(meetsMinimumSwap(null)).toBe(false);
  });

  it("respects a custom minimum", () => {
    expect(meetsMinimumSwap(30, 50)).toBe(false);
    expect(meetsMinimumSwap(50, 50)).toBe(true);
  });
});

describe("meetsMinimumFee ($0.02 floor)", () => {
  it("rejects fees below $0.02", () => {
    expect(meetsMinimumFee(0.019)).toBe(false);
    expect(meetsMinimumFee(0.01)).toBe(false);
  });

  it("accepts exactly $0.02", () => {
    expect(meetsMinimumFee(0.02)).toBe(true);
  });

  it("rejects a null (unverifiable) fee", () => {
    expect(meetsMinimumFee(null)).toBe(false);
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
