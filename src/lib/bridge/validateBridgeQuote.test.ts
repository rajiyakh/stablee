import { describe, expect, it } from "vitest";
import { validateBridgeQuote, type ValidatedBridgeQuote } from "./validateBridgeQuote";
import type { NormalizedBridgeQuote } from "./types";

const FROM_TOKEN = "0x0bd7d308f8e1639fab988df18a8011f41eacad73";
const TO_TOKEN = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";
const SENDER = "0x1111111111111111111111111111111111aaaa";

function baseQuote(overrides: Partial<NormalizedBridgeQuote> = {}): NormalizedBridgeQuote {
  const fetchedAt = Date.now();
  return {
    provider: "lifi",
    routeId: "route-1",
    inputAmount: "1000000",
    platformFeeAmount: "10000",
    providerFeeAmount: "500",
    gasCostUsd: 1.2,
    estimatedOutputAmount: "989500",
    minimumReceived: "980000",
    estimatedTimeSeconds: 120,
    priceImpactPercent: 0.2,
    approvalTarget: "0xApprovalTarget00000000000000000000000",
    transactionRequest: {
      to: "0xTxTarget000000000000000000000000000000",
      data: "0xdeadbeef",
      value: "0",
      chainId: 4663,
    },
    meta: {
      feeMode: "provider-native",
      fetchedAt,
      expiresAt: fetchedAt + 30_000,
      fromChainId: 4663,
      toChainId: 1,
      fromToken: {
        chainId: 4663,
        address: FROM_TOKEN,
        symbol: "WETH",
        name: "WETH",
        decimals: 18,
        logoUrl: null,
        priceUsd: null,
      },
      toToken: {
        chainId: 1,
        address: TO_TOKEN,
        symbol: "USDG",
        name: "Global Dollar",
        decimals: 6,
        logoUrl: null,
        priceUsd: null,
      },
      recipientEchoed: SENDER,
      steps: [],
      trackingUrl: null,
      requiresApproval: true,
      providerRiskNotes: [],
    },
    ...overrides,
  };
}

const baseCtx = {
  expectedFromChainId: 4663,
  expectedToChainId: 1,
  expectedFromToken: FROM_TOKEN,
  expectedToToken: TO_TOKEN,
  expectedFromAmount: "1000000",
  expectedRecipient: SENDER,
  expectedFeeBps: 100,
  contractAllowlist: {},
};

describe("validateBridgeQuote", () => {
  it("accepts a fully consistent quote", () => {
    const result = validateBridgeQuote(baseQuote(), baseCtx);
    expect(result.ok).toBe(true);
  });

  it("rejects a quote whose fee mode is unavailable", () => {
    const quote = baseQuote({ meta: { ...baseQuote().meta, feeMode: "unavailable" } });
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContainEqual({ code: "fee_mode_unavailable" });
  });

  it("rejects an expired quote", () => {
    const quote = baseQuote({
      meta: { ...baseQuote().meta, fetchedAt: Date.now() - 60_000, expiresAt: Date.now() - 30_000 },
    });
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.code === "quote_expired")).toBe(true);
  });

  it("rejects a chain mismatch on the source token's own chainId (provider-echoed, not just our request params)", () => {
    const quote = baseQuote({
      meta: {
        ...baseQuote().meta,
        fromToken: { ...baseQuote().meta.fromToken, chainId: 1 },
      },
    });
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContainEqual({ code: "chain_mismatch" });
  });

  it("rejects a chain mismatch on the destination token's own chainId", () => {
    const quote = baseQuote({
      meta: {
        ...baseQuote().meta,
        toToken: { ...baseQuote().meta.toToken, chainId: 4663 },
      },
    });
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContainEqual({ code: "chain_mismatch" });
  });

  it("rejects when the provider's transactionRequest targets a different chain than requested", () => {
    const quote = baseQuote({
      transactionRequest: { ...baseQuote().transactionRequest!, chainId: 1 },
    });
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContainEqual({ code: "chain_mismatch" });
  });

  it("rejects an input amount that doesn't match what was actually requested", () => {
    const quote = baseQuote({ inputAmount: "500000" });
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual({
        code: "input_amount_mismatch",
        expected: "1000000",
        actual: "500000",
      });
    }
  });

  it("rejects a malformed (non-integer) input amount instead of throwing", () => {
    const quote = baseQuote({ inputAmount: "1.5" });
    expect(() => validateBridgeQuote(quote, baseCtx)).not.toThrow();
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContainEqual({ code: "invalid_amount" });
  });

  it("rejects a malformed estimatedOutputAmount instead of throwing", () => {
    const quote = baseQuote({ estimatedOutputAmount: "not-a-number" });
    expect(() => validateBridgeQuote(quote, baseCtx)).not.toThrow();
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContainEqual({ code: "zero_output" });
  });

  it("rejects a token mismatch", () => {
    const quote = baseQuote({
      meta: {
        ...baseQuote().meta,
        fromToken: {
          ...baseQuote().meta.fromToken,
          address: "0xWrong0000000000000000000000000000000",
        },
      },
    });
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContainEqual({ code: "token_mismatch" });
  });

  it("rejects a recipient mismatch when the provider echoes a different address", () => {
    const quote = baseQuote({
      meta: { ...baseQuote().meta, recipientEchoed: "0x9999999999999999999999999999999999999" },
    });
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContainEqual({ code: "recipient_mismatch" });
  });

  it("accepts when the provider does not echo a recipient at all (unverifiable, not assumed wrong)", () => {
    const quote = baseQuote({ meta: { ...baseQuote().meta, recipientEchoed: null } });
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(true);
  });

  it("rejects a missing transaction", () => {
    const quote = baseQuote({ transactionRequest: undefined });
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContainEqual({ code: "missing_transaction" });
  });

  it("rejects a transaction target not on a configured allowlist", () => {
    const quote = baseQuote();
    const ctx = {
      ...baseCtx,
      contractAllowlist: { 4663: ["0xSomeOtherContract00000000000000000000"] },
    };
    const result = validateBridgeQuote(quote, ctx);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.code === "untrusted_tx_target")).toBe(true);
    }
  });

  it("rejects severe price impact", () => {
    const quote = baseQuote({ priceImpactPercent: 5 });
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.code === "price_impact_severe")).toBe(true);
  });

  it("rejects a zero-output quote", () => {
    const quote = baseQuote({ estimatedOutputAmount: "0" });
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContainEqual({ code: "zero_output" });
  });

  it("rejects when the provider-native fee is missing", () => {
    const quote = baseQuote({ platformFeeAmount: "0" });
    const result = validateBridgeQuote(quote, baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContainEqual({ code: "fee_missing" });
  });

  it("type-brands the success result so a raw quote cannot be assigned where ValidatedBridgeQuote is required", () => {
    const result = validateBridgeQuote(baseQuote(), baseCtx);
    if (result.ok) {
      const validated: ValidatedBridgeQuote = result.quote;
      expect(validated.routeId).toBe("route-1");
      // @ts-expect-error a raw NormalizedBridgeQuote is not a ValidatedBridgeQuote
      const notValidated: ValidatedBridgeQuote = baseQuote();
      expect(notValidated).toBeDefined();
    }
  });
});
