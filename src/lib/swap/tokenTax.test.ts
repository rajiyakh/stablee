import { describe, expect, it } from "vitest";
import { detectTokenTax } from "./tokenTax";
import type { ZeroExQuoteResponse } from "./schemas";

const SELL = "0x0bd7d308f8e1639fab988df18a8011f41eacad73";
const BUY = "0x5fc5360d0400a0fd4f2af552add042d716f1d168";

function baseQuote(overrides: Partial<ZeroExQuoteResponse> = {}): ZeroExQuoteResponse {
  return {
    liquidityAvailable: true,
    buyAmount: "1000000",
    sellAmount: "1000000000000000000",
    sellToken: SELL,
    buyToken: BUY,
    transaction: { to: "0xabc", data: "0x00", value: "0" },
    ...overrides,
  } as ZeroExQuoteResponse;
}

describe("detectTokenTax", () => {
  it("returns null when there is no liquidity", () => {
    expect(detectTokenTax({ liquidityAvailable: false } as ZeroExQuoteResponse)).toBeNull();
  });

  it("returns null when tokenMetadata is absent", () => {
    expect(detectTokenTax(baseQuote())).toBeNull();
  });

  it("reports no tax when all tax fields are zero", () => {
    const result = detectTokenTax(
      baseQuote({
        tokenMetadata: {
          sellToken: { buyTaxBps: "0", sellTaxBps: "0", transferTaxBps: "0" },
          buyToken: { buyTaxBps: "0", sellTaxBps: "0", transferTaxBps: "0" },
        },
      }),
    );
    expect(result?.hasTax).toBe(false);
  });

  it("detects a real sell tax", () => {
    const result = detectTokenTax(
      baseQuote({
        tokenMetadata: {
          sellToken: { sellTaxBps: "500" },
        },
      }),
    );
    expect(result?.hasTax).toBe(true);
    expect(result?.maxBps).toBe(500);
    expect(result?.sellTaxBps).toBe(500);
  });

  it("detects a real buy tax on the buy token", () => {
    const result = detectTokenTax(
      baseQuote({
        tokenMetadata: {
          buyToken: { buyTaxBps: "250" },
        },
      }),
    );
    expect(result?.hasTax).toBe(true);
    expect(result?.buyTaxBps).toBe(250);
  });

  it("takes the maximum across sell/buy/transfer tax fields", () => {
    const result = detectTokenTax(
      baseQuote({
        tokenMetadata: {
          sellToken: { sellTaxBps: "100", transferTaxBps: "900" },
          buyToken: { buyTaxBps: "300" },
        },
      }),
    );
    expect(result?.maxBps).toBe(900);
  });

  it("treats a null/missing tax field as unknown, not zero, without crashing", () => {
    const result = detectTokenTax(
      baseQuote({
        tokenMetadata: {
          sellToken: { sellTaxBps: null },
          buyToken: {},
        },
      }),
    );
    expect(result?.hasTax).toBe(false);
    expect(result?.sellTaxBps).toBeNull();
  });
});
