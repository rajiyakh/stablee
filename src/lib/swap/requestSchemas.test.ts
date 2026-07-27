import { describe, expect, it } from "vitest";
import { swapPriceRequestSchema, swapQuoteRequestSchema } from "./requestSchemas";

const SELL = "0x0bd7d308f8e1639fab988df18a8011f41eacad73";
const BUY = "0x5fc5360d0400a0fd4f2af552add042d716f1d168";
const TAKER = "0x0bd7d308f8e1639fab988df18a8011f41eacad72";

/**
 * The security property "the client cannot override chainId / swapFeeRecipient /
 * swapFeeBps / the 0x API key" is enforced structurally: these request schemas
 * have no such keys defined, and Zod's z.object() strips unrecognized keys by
 * default (no .passthrough() is used anywhere in this file). This test proves
 * that mechanism directly rather than mocking the whole route handler.
 */
describe("swap request schemas reject fee/chain tampering", () => {
  const maliciousInput = {
    sellToken: SELL,
    buyToken: BUY,
    sellAmount: "1000000000000000000",
    taker: TAKER,
    chainId: 1, // attempt to redirect to Ethereum mainnet
    swapFeeRecipient: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", // attempt to steal the fee
    swapFeeBps: 10000, // attempt to raise the fee to 100%
    swapFeeToken: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", // attempt an unrelated fee token
    apiKey: "stolen-key",
    "0x-api-key": "stolen-key",
  };

  it("swapPriceRequestSchema strips every tampering field, keeping only the allowed shape", () => {
    const parsed = swapPriceRequestSchema.parse(maliciousInput);
    expect(parsed).not.toHaveProperty("chainId");
    expect(parsed).not.toHaveProperty("swapFeeRecipient");
    expect(parsed).not.toHaveProperty("swapFeeBps");
    expect(parsed).not.toHaveProperty("swapFeeToken");
    expect(parsed).not.toHaveProperty("apiKey");
    expect(Object.keys(parsed).sort()).toEqual(
      ["sellAmount", "sellToken", "taker", "buyToken"].sort(),
    );
  });

  it("swapQuoteRequestSchema strips every tampering field, keeping only the allowed shape", () => {
    const parsed = swapQuoteRequestSchema.parse(maliciousInput);
    expect(parsed).not.toHaveProperty("chainId");
    expect(parsed).not.toHaveProperty("swapFeeRecipient");
    expect(parsed).not.toHaveProperty("swapFeeBps");
    expect(parsed).not.toHaveProperty("swapFeeToken");
    expect(parsed).not.toHaveProperty("apiKey");
  });

  it("rejects an invalid (non-EVM) sellToken address", () => {
    const result = swapPriceRequestSchema.safeParse({
      ...maliciousInput,
      sellToken: "not-an-address",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a request that supplies both sellAmount and buyAmount", () => {
    const result = swapPriceRequestSchema.safeParse({
      sellToken: SELL,
      buyToken: BUY,
      sellAmount: "1",
      buyAmount: "1",
    });
    expect(result.success).toBe(false);
  });

  it("swapQuoteRequestSchema requires taker; swapPriceRequestSchema does not", () => {
    const withoutTaker = { sellToken: SELL, buyToken: BUY, sellAmount: "1" };
    expect(swapPriceRequestSchema.safeParse(withoutTaker).success).toBe(true);
    expect(swapQuoteRequestSchema.safeParse(withoutTaker).success).toBe(false);
  });
});
