import { describe, expect, it } from "vitest";
import { zeroExPriceResponseSchema, zeroExQuoteResponseSchema } from "./schemas";

const SELL = "0x0bd7d308f8e1639fab988df18a8011f41eacad73";
const BUY = "0x5fc5360d0400a0fd4f2af552add042d716f1d168";
const SPENDER = "0x0000000000001ff3684f28c67538d4d072c22734";

describe("zeroExPriceResponseSchema", () => {
  it("parses the liquidityAvailable:false short-circuit shape", () => {
    const parsed = zeroExPriceResponseSchema.parse({ liquidityAvailable: false, zid: "abc" });
    expect(parsed.liquidityAvailable).toBe(false);
  });

  it("parses a full liquidity-available price response", () => {
    const parsed = zeroExPriceResponseSchema.parse({
      liquidityAvailable: true,
      buyAmount: "1000000",
      buyToken: BUY,
      sellAmount: "1000000000000000000",
      sellToken: SELL,
      fees: {
        integratorFee: { amount: "500000000000000", token: SELL, type: "volume" },
      },
      issues: { allowance: { actual: "0", spender: SPENDER } },
    });
    expect(parsed.liquidityAvailable).toBe(true);
    if (parsed.liquidityAvailable) {
      expect(parsed.fees?.integratorFee?.amount).toBe("500000000000000");
    }
  });

  it("rejects a malformed response missing required fields", () => {
    expect(() => zeroExPriceResponseSchema.parse({ liquidityAvailable: true })).toThrow();
  });
});

describe("zeroExQuoteResponseSchema", () => {
  it("requires a transaction object when liquidity is available", () => {
    const withoutTransaction = {
      liquidityAvailable: true,
      buyAmount: "1000000",
      buyToken: BUY,
      sellAmount: "1000000000000000000",
      sellToken: SELL,
    };
    expect(() => zeroExQuoteResponseSchema.parse(withoutTransaction)).toThrow();
  });

  it("parses a full firm quote with a transaction", () => {
    const parsed = zeroExQuoteResponseSchema.parse({
      liquidityAvailable: true,
      buyAmount: "1000000",
      buyToken: BUY,
      sellAmount: "1000000000000000000",
      sellToken: SELL,
      transaction: { to: SPENDER, data: "0x00", value: "0" },
    });
    expect(parsed.liquidityAvailable).toBe(true);
    if (parsed.liquidityAvailable) {
      expect(parsed.transaction.to).toBe(SPENDER);
    }
  });

  it("parses the no-liquidity shape without requiring a transaction", () => {
    const parsed = zeroExQuoteResponseSchema.parse({ liquidityAvailable: false });
    expect(parsed.liquidityAvailable).toBe(false);
  });
});
