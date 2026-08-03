import { describe, expect, it } from "vitest";
import {
  bridgeQuoteRequestSchema,
  bridgeStatusRequestSchema,
  bridgeTokensRequestSchema,
} from "./requestSchemas";

const FROM = "0x0bd7d308f8e1639fab988df18a8011f41eacad73";
const TO = "0x5fc5360d0400a0fd4f2af552add042d716f1d168";
const SENDER = "0x0bd7d308f8e1639fab988df18a8011f41eacad72";

/**
 * The security property "the client cannot supply feeBps / treasury /
 * calldata / an API key" is enforced structurally: bridgeQuoteRequestSchema
 * has no such keys defined, and z.object() strips unrecognized keys by
 * default. This proves that mechanism directly, mirroring
 * src/lib/swap/requestSchemas.test.ts.
 */
describe("bridgeQuoteRequestSchema rejects fee/calldata tampering", () => {
  const maliciousInput = {
    fromChainId: 1,
    toChainId: 4663,
    fromToken: FROM,
    toToken: TO,
    fromAmount: "1000000000000000000",
    sender: SENDER,
    recipient: SENDER,
    feeBps: 0, // attempt to zero out the platform fee
    treasury: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", // attempt to redirect the fee
    to: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", // attempt to inject calldata target
    data: "0xdeadbeef",
    value: "0",
    apiKey: "stolen-key",
  };

  it("strips every tampering field, keeping only the allowed shape", () => {
    const parsed = bridgeQuoteRequestSchema.parse(maliciousInput);
    expect(parsed).not.toHaveProperty("feeBps");
    expect(parsed).not.toHaveProperty("treasury");
    expect(parsed).not.toHaveProperty("to");
    expect(parsed).not.toHaveProperty("data");
    expect(parsed).not.toHaveProperty("value");
    expect(parsed).not.toHaveProperty("apiKey");
    expect(Object.keys(parsed).sort()).toEqual(
      [
        "fromChainId",
        "toChainId",
        "fromToken",
        "toToken",
        "fromAmount",
        "sender",
        "recipient",
      ].sort(),
    );
  });

  it("rejects an invalid (non-EVM) fromToken address", () => {
    const result = bridgeQuoteRequestSchema.safeParse({
      ...maliciousInput,
      fromToken: "not-an-address",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer-string fromAmount", () => {
    const result = bridgeQuoteRequestSchema.safeParse({ ...maliciousInput, fromAmount: "1.5" });
    expect(result.success).toBe(false);
  });

  it("accepts an optional sort mode and rejects an invalid one", () => {
    expect(bridgeQuoteRequestSchema.safeParse({ ...maliciousInput, sort: "fastest" }).success).toBe(
      true,
    );
    expect(
      bridgeQuoteRequestSchema.safeParse({ ...maliciousInput, sort: "cheapest" }).success,
    ).toBe(false);
  });
});

describe("bridgeTokensRequestSchema", () => {
  it("coerces a numeric chainId from a query string", () => {
    const result = bridgeTokensRequestSchema.safeParse({ chainId: "4663" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.chainId).toBe(4663);
  });
});

describe("bridgeStatusRequestSchema", () => {
  it("requires a known provider id", () => {
    const result = bridgeStatusRequestSchema.safeParse({
      provider: "unknown-provider",
      routeId: "r1",
      txHash: `0x${"a".repeat(64)}`,
      fromChainId: 1,
      toChainId: 4663,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed status request", () => {
    const result = bridgeStatusRequestSchema.safeParse({
      provider: "lifi",
      routeId: "r1",
      txHash: `0x${"a".repeat(64)}`,
      fromChainId: 1,
      toChainId: 4663,
    });
    expect(result.success).toBe(true);
  });
});
