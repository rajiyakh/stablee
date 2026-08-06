import { describe, expect, it } from "vitest";
import {
  isNativeAddress,
  normalizeAcrossQuote,
  normalizeLifiQuote,
  normalizeRelayQuote,
  toCanonicalNativeSentinel,
  type NormalizeContext,
} from "./normalize";
import { BRIDGE_NATIVE_SENTINEL } from "./types";
import type { BridgeQuoteParams, SupportedToken } from "./types";

const params: BridgeQuoteParams = {
  fromChainId: 1,
  toChainId: 4663,
  fromToken: "0xfromtoken0000000000000000000000000000",
  toToken: "0xtotoken00000000000000000000000000000000",
  fromAmount: "1000000",
  sender: "0xsender000000000000000000000000000000000",
  recipient: "0xsender000000000000000000000000000000000",
  slippageBps: 100,
};

const fromToken: SupportedToken = {
  chainId: 1,
  address: params.fromToken,
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  logoUrl: null,
  priceUsd: 1,
};

const toToken: SupportedToken = {
  chainId: 4663,
  address: params.toToken,
  symbol: "USDG",
  name: "Global Dollar",
  decimals: 6,
  logoUrl: null,
  priceUsd: 1,
};

const ctx: NormalizeContext = { params, fromToken, toToken, feeBps: 100 };

describe("native sentinel translation", () => {
  it("recognizes both the 0x000...000 and 0xEeee...EEeE conventions as native", () => {
    expect(isNativeAddress("0x0000000000000000000000000000000000000000")).toBe(true);
    expect(isNativeAddress(BRIDGE_NATIVE_SENTINEL)).toBe(true);
    expect(isNativeAddress("0xfromtoken0000000000000000000000000000")).toBe(false);
  });

  it("round-trips both native conventions to the canonical sentinel", () => {
    expect(toCanonicalNativeSentinel("0x0000000000000000000000000000000000000000")).toBe(
      BRIDGE_NATIVE_SENTINEL,
    );
    expect(toCanonicalNativeSentinel(BRIDGE_NATIVE_SENTINEL)).toBe(BRIDGE_NATIVE_SENTINEL);
  });

  it("leaves a non-native address untouched", () => {
    const addr = "0xfromtoken0000000000000000000000000000";
    expect(toCanonicalNativeSentinel(addr)).toBe(addr);
  });
});

describe("normalizeLifiQuote", () => {
  function rawQuote(
    feeCosts: Array<{
      name: string;
      amount: string;
      included: boolean;
      feeSplit?: { lifiFee?: string; integratorFee?: string; intermediaryFee?: string };
    }>,
  ) {
    return {
      id: "lifi-route-1",
      tool: "stargate",
      action: {
        fromChainId: 1,
        toChainId: 4663,
        fromToken: { address: fromToken.address, symbol: "USDC", decimals: 6, chainId: 1 },
        toToken: { address: toToken.address, symbol: "USDG", decimals: 6, chainId: 4663 },
        fromAmount: "1000000",
        toAddress: params.recipient,
      },
      estimate: {
        fromAmount: "1000000",
        toAmount: "989000",
        toAmountMin: "980000",
        approvalAddress: "0xApprovalTarget0000000000000000000000",
        feeCosts: feeCosts.map((f) => ({
          name: f.name,
          token: { address: toToken.address, symbol: "USDG", decimals: 6 },
          amount: f.amount,
          included: f.included,
          feeSplit: f.feeSplit,
        })),
        gasCosts: [
          { amount: "1000000000000000", amountUSD: "2.50", token: { symbol: "ETH", decimals: 18 } },
        ],
        executionDuration: 180,
      },
      transactionRequest: {
        to: "0xTxTarget00000000000000000000000000000",
        data: "0xdead",
        value: "0",
        chainId: 1,
      },
    };
  }

  it("reads platformFeeAmount from feeSplit.integratorFee when present, never computes it", () => {
    const raw = rawQuote([
      {
        name: "LI.FI Fee",
        amount: "13000",
        included: true,
        feeSplit: { lifiFee: "3000", integratorFee: "10000" },
      },
    ]);
    const quote = normalizeLifiQuote(raw as never, ctx);
    expect(quote.platformFeeAmount).toBe("10000");
    expect(quote.providerFeeAmount).toBe("3000");
    expect(quote.provider).toBe("lifi");
  });

  it("falls back to name-matching only when a feeCost has no feeSplit at all", () => {
    const raw = rawQuote([{ name: "LI.FI Integrator Fee", amount: "10000", included: true }]);
    const quote = normalizeLifiQuote(raw as never, ctx);
    expect(quote.platformFeeAmount).toBe("10000");
  });

  it("does not back-compute a fee when no integrator signal is present at all (stays 0)", () => {
    const raw = rawQuote([]);
    const quote = normalizeLifiQuote(raw as never, ctx);
    expect(quote.platformFeeAmount).toBe("0");
  });

  it("sums non-integrator fee entries into providerFeeAmount, separate from the platform fee", () => {
    const raw = rawQuote([
      { name: "LI.FI Integrator Fee", amount: "10000", included: true },
      { name: "Bridge fee", amount: "3000", included: true },
    ]);
    const quote = normalizeLifiQuote(raw as never, ctx);
    expect(quote.platformFeeAmount).toBe("10000");
    expect(quote.providerFeeAmount).toBe("3000");
  });

  it("uses the provider's own token decimals, not swapTokens.ts", () => {
    const raw = rawQuote([]);
    const quote = normalizeLifiQuote(raw as never, ctx);
    expect(quote.meta.fromToken.decimals).toBe(6);
    expect(quote.meta.toToken.decimals).toBe(6);
  });

  it("echoes the recipient from action.toAddress", () => {
    const raw = rawQuote([]);
    const quote = normalizeLifiQuote(raw as never, ctx);
    expect(quote.meta.recipientEchoed).toBe(params.recipient);
  });

  it("never mixes fee entries denominated in different tokens into one BigInt sum", () => {
    // rawQuote() always denominates every feeCosts entry in toToken.address —
    // this test deliberately overrides one entry to a third, different
    // token to exercise the actual mixed-denomination guard.
    const raw = rawQuote([
      { name: "LI.FI Integrator Fee", amount: "10000", included: true },
      { name: "Gas rebate", amount: "999999999", included: false },
    ]);
    raw.estimate.feeCosts[1] = {
      ...raw.estimate.feeCosts[1],
      token: { address: "0xsomeOtherToken000000000000000000000000", symbol: "ETH", decimals: 18 },
    };
    const quote = normalizeLifiQuote(raw as never, ctx);
    // The first entry (toToken-denominated) establishes the denomination;
    // the second entry, in a different token, is excluded rather than
    // summed in — providerFeeAmount must not include "999999999".
    expect(quote.platformFeeAmount).toBe("10000");
    expect(quote.providerFeeAmount).toBe("0");
  });
});

describe("normalizeRelayQuote", () => {
  function rawQuote(appFeeAmount: string | undefined) {
    return {
      steps: [
        {
          kind: "approve",
          items: [
            { data: { to: "0xApprovalTarget0000000000000000000000", data: "0x", chainId: 1 } },
          ],
        },
        {
          kind: "bridge",
          items: [
            {
              data: {
                to: "0xTxTarget00000000000000000000000000000",
                data: "0xdead",
                value: "0",
                chainId: 1,
              },
            },
          ],
        },
      ],
      fees: {
        gas: { amount: "1000000000000000", amountUsd: "1.10" },
        relayer: { amount: "500" },
        app: appFeeAmount ? { amount: appFeeAmount } : undefined,
      },
      details: {
        currencyIn: {
          currency: { address: fromToken.address, symbol: "USDC", decimals: 6, chainId: 1 },
          amount: "1000000",
        },
        currencyOut: {
          currency: { address: toToken.address, symbol: "USDG", decimals: 6, chainId: 4663 },
          amount: "989000",
        },
        recipient: params.recipient,
        timeEstimate: 60,
      },
    };
  }

  it("reads platformFeeAmount from fees.app only, never computes it", () => {
    const quote = normalizeRelayQuote(rawQuote("10000") as never, ctx);
    expect(quote.platformFeeAmount).toBe("10000");
  });

  it("stays 0 when fees.app is absent (app fee not confirmed/configured)", () => {
    const quote = normalizeRelayQuote(rawQuote(undefined) as never, ctx);
    expect(quote.platformFeeAmount).toBe("0");
  });

  it("keeps gas cost separate from provider/platform fees", () => {
    const quote = normalizeRelayQuote(rawQuote("10000") as never, ctx);
    expect(quote.gasCostUsd).toBe(1.1);
    expect(quote.providerFeeAmount).toBe("500");
  });
});

describe("normalizeAcrossQuote", () => {
  // Fixture shape matches the REAL, live-confirmed GET /api/swap/approval
  // response (confirmed against app.across.to during planning) —
  // fees.total.details.app is Across's own first-class app-fee slot.
  function rawQuote(appFeeAmount: string | undefined) {
    return {
      id: "across-route-1",
      inputAmount: "1000000",
      expectedOutputAmount: "989000",
      minOutputAmount: "980000",
      expectedFillTime: 90,
      quoteExpiryTimestamp: Math.floor(Date.now() / 1000) + 120,
      fees: {
        total: {
          amount: "11500",
          details: {
            app: appFeeAmount ? { amount: appFeeAmount } : undefined,
            bridge: {
              amount: "1500",
              details: {
                lp: { amount: "1000" },
                relayerCapital: { amount: "300" },
                destinationGas: { amount: "200" },
              },
            },
          },
        },
      },
      originGas: { amount: "500000000000000", amountUsd: "0.80" },
      swapTx: {
        to: "0xTxTarget00000000000000000000000000000",
        data: "0xdead",
        value: "0",
        chainId: 1,
      },
    };
  }

  it("reads platformFeeAmount from fees.total.details.app only, never computes it", () => {
    const quote = normalizeAcrossQuote(rawQuote("10000") as never, ctx);
    expect(quote.platformFeeAmount).toBe("10000");
  });

  it("stays 0 when fees.total.details.app is absent (app fee not confirmed/configured)", () => {
    const quote = normalizeAcrossQuote(rawQuote(undefined) as never, ctx);
    expect(quote.platformFeeAmount).toBe("0");
  });

  it("sums lp + relayerCapital + destinationGas into providerFeeAmount, separate from the platform fee", () => {
    const quote = normalizeAcrossQuote(rawQuote("10000") as never, ctx);
    expect(quote.providerFeeAmount).toBe("1500");
  });

  it("reads gas cost from originGas.amountUsd", () => {
    const quote = normalizeAcrossQuote(rawQuote("10000") as never, ctx);
    expect(quote.gasCostUsd).toBe(0.8);
  });

  it("honors Across's own quote expiry as an earlier ceiling than the default TTL", () => {
    const raw = rawQuote("10000");
    raw.quoteExpiryTimestamp = Math.floor(Date.now() / 1000) + 5; // expires in 5s, well under the 30s default TTL
    const quote = normalizeAcrossQuote(raw as never, ctx);
    expect(quote.meta.expiresAt).toBeLessThan(Date.now() + 30_000);
  });
});
