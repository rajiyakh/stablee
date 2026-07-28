import { describe, expect, it } from "vitest";
import { validateQuote, type QuoteValidationContext } from "./validateQuote";
import type { ZeroExQuoteResponse } from "./schemas";

const SELL = "0x0bd7d308f8e1639fab988df18a8011f41eacad73";
const BUY = "0x5fc5360d0400a0fd4f2af552add042d716f1d168";
const SPENDER = "0x0000000000001ff3684f28c67538d4d072c22734";

function baseCtx(overrides: Partial<QuoteValidationContext> = {}): QuoteValidationContext {
  return {
    expectedSellToken: SELL,
    expectedBuyToken: BUY,
    fetchedAt: Date.now(),
    quoteTtlMs: 30_000,
    requireTransaction: true,
    priceImpactBps: null,
    ...overrides,
  };
}

function baseQuote(overrides: Partial<ZeroExQuoteResponse> = {}): ZeroExQuoteResponse {
  return {
    liquidityAvailable: true,
    buyAmount: "1000000",
    sellAmount: "1000000000000000000",
    minBuyAmount: "990000",
    sellToken: SELL,
    buyToken: BUY,
    fees: { integratorFee: { amount: "500000000000000", token: SELL, type: "volume" } },
    issues: {},
    transaction: { to: "0xabc", data: "0x00", value: "0" },
    ...overrides,
  } as ZeroExQuoteResponse;
}

describe("validateQuote", () => {
  it("rejects no-liquidity responses", () => {
    const result = validateQuote({ liquidityAvailable: false } as ZeroExQuoteResponse, baseCtx());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toEqual([{ code: "no_liquidity" }]);
  });

  it("accepts a fully valid quote", () => {
    const result = validateQuote(baseQuote(), baseCtx());
    expect(result.ok).toBe(true);
  });

  it("rejects when sellToken doesn't match the request", () => {
    const result = validateQuote(baseQuote({ sellToken: "0xdeadbeef" }), baseCtx());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.code === "token_mismatch")).toBe(true);
  });

  it("rejects when buyToken doesn't match the request", () => {
    const result = validateQuote(baseQuote({ buyToken: "0xdeadbeef" }), baseCtx());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.code === "token_mismatch")).toBe(true);
  });

  it("requires a transaction when requireTransaction is true", () => {
    const quote = baseQuote();
    delete (quote as Record<string, unknown>).transaction;
    const result = validateQuote(quote, baseCtx({ requireTransaction: true }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.code === "missing_transaction")).toBe(true);
  });

  it("does not require a transaction for a price (indicative) check", () => {
    const quote = baseQuote();
    delete (quote as Record<string, unknown>).transaction;
    const result = validateQuote(quote, baseCtx({ requireTransaction: false }));
    expect(result.ok).toBe(true);
  });

  it("rejects when the integrator fee is missing", () => {
    const result = validateQuote(baseQuote({ fees: {} }), baseCtx());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.code === "fee_missing")).toBe(true);
  });

  it("rejects a balance issue", () => {
    const result = validateQuote(
      baseQuote({ issues: { balance: { token: SELL, actual: "0", expected: "1" } } }),
      baseCtx(),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.code === "balance_issue")).toBe(true);
  });

  it("rejects an incomplete simulation", () => {
    const result = validateQuote(baseQuote({ issues: { simulationIncomplete: true } }), baseCtx());
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.issues.some((i) => i.code === "simulation_incomplete")).toBe(true);
  });

  it("does NOT treat a normal pre-approval allowance issue as a validation failure", () => {
    const result = validateQuote(
      baseQuote({ issues: { allowance: { actual: "0", spender: SPENDER } } }),
      baseCtx(),
    );
    expect(result.ok).toBe(true);
  });

  it("rejects an expired quote", () => {
    const result = validateQuote(
      baseQuote(),
      baseCtx({ fetchedAt: Date.now() - 60_000, quoteTtlMs: 30_000 }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.code === "quote_expired")).toBe(true);
  });

  it("accepts a quote still within its TTL", () => {
    const result = validateQuote(
      baseQuote(),
      baseCtx({ fetchedAt: Date.now() - 5_000, quoteTtlMs: 30_000 }),
    );
    expect(result.ok).toBe(true);
  });

  it("blocks a swap when price impact is at or above the 3% safety threshold", () => {
    const result = validateQuote(baseQuote(), baseCtx({ priceImpactBps: 300 }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.code === "price_impact_severe")).toBe(true);
    }
  });

  it("blocks a swap with extreme price impact", () => {
    const result = validateQuote(baseQuote(), baseCtx({ priceImpactBps: 1000 }));
    expect(result.ok).toBe(false);
  });

  it("accepts a swap with mild price impact below the threshold", () => {
    const result = validateQuote(baseQuote(), baseCtx({ priceImpactBps: 50 }));
    expect(result.ok).toBe(true);
  });

  it("does not block on price impact when it could not be determined", () => {
    const result = validateQuote(baseQuote(), baseCtx({ priceImpactBps: null }));
    expect(result.ok).toBe(true);
  });
});
