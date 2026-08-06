import { describe, expect, it } from "vitest";
import { rankRoutes } from "./rank";
import type { NormalizedBridgeQuote } from "./types";

function quote(overrides: Partial<NormalizedBridgeQuote>): NormalizedBridgeQuote {
  return {
    provider: "lifi",
    routeId: "r",
    inputAmount: "1000000",
    platformFeeAmount: "10000",
    providerFeeAmount: "1000",
    gasCostUsd: null,
    estimatedOutputAmount: "989000",
    minimumReceived: "980000",
    estimatedTimeSeconds: null,
    priceImpactPercent: 0,
    meta: {
      feeMode: "provider-native",
      fetchedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
      fromChainId: 4663,
      toChainId: 1,
      fromToken: {
        chainId: 4663,
        address: "0xa",
        symbol: "A",
        name: "A",
        decimals: 18,
        logoUrl: null,
        priceUsd: null,
      },
      toToken: {
        chainId: 1,
        address: "0xb",
        symbol: "B",
        name: "B",
        decimals: 18,
        logoUrl: null,
        priceUsd: null,
      },
      recipientEchoed: null,
      steps: [],
      trackingUrl: null,
      requiresApproval: false,
      providerRiskNotes: [],
    },
    ...overrides,
  };
}

describe("rankRoutes bestReturn", () => {
  it("orders by estimatedOutputAmount descending", () => {
    const low = quote({ routeId: "low", estimatedOutputAmount: "900000" });
    const high = quote({ routeId: "high", estimatedOutputAmount: "990000" });
    const mid = quote({ routeId: "mid", estimatedOutputAmount: "950000" });
    const ranked = rankRoutes([low, high, mid], "bestReturn");
    expect(ranked.map((r) => r.routeId)).toEqual(["high", "mid", "low"]);
  });

  it("handles amounts above Number.MAX_SAFE_INTEGER correctly via BigInt", () => {
    const bigger = quote({
      routeId: "bigger",
      estimatedOutputAmount: "99999999999999999999999999",
    });
    const smaller = quote({
      routeId: "smaller",
      estimatedOutputAmount: "9999999999999999999999999",
    });
    const ranked = rankRoutes([smaller, bigger], "bestReturn");
    expect(ranked.map((r) => r.routeId)).toEqual(["bigger", "smaller"]);
  });

  it("uses gas as a tie-break only when both sides report it", () => {
    const cheapGas = quote({
      routeId: "cheapGas",
      estimatedOutputAmount: "990000",
      gasCostUsd: 0.5,
    });
    const expensiveGas = quote({
      routeId: "expensiveGas",
      estimatedOutputAmount: "990000",
      gasCostUsd: 2,
    });
    const ranked = rankRoutes([expensiveGas, cheapGas], "bestReturn");
    expect(ranked.map((r) => r.routeId)).toEqual(["cheapGas", "expensiveGas"]);
  });

  it("treats a non-finite gasCostUsd the same as not-reported, never letting NaN break the sort", () => {
    const nanGas = quote({
      routeId: "nanGas",
      estimatedOutputAmount: "990000",
      gasCostUsd: Number.NaN,
      estimatedTimeSeconds: 100,
    });
    const cleanGas = quote({
      routeId: "cleanGas",
      estimatedOutputAmount: "990000",
      gasCostUsd: 1,
      estimatedTimeSeconds: 50,
    });
    // Equal output; nanGas's unusable gas value must fall through to the
    // time tie-break rather than participating in `aGas - bGas`.
    const ranked = rankRoutes([cleanGas, nanGas], "bestReturn");
    expect(ranked.map((r) => r.routeId)).toEqual(["cleanGas", "nanGas"]);
  });

  it("does not let a missing gasCostUsd on one side silently win the tie-break", () => {
    const reportsGas = quote({
      routeId: "reportsGas",
      estimatedOutputAmount: "990000",
      gasCostUsd: 5,
      estimatedTimeSeconds: 100,
    });
    const noGasData = quote({
      routeId: "noGasData",
      estimatedOutputAmount: "990000",
      gasCostUsd: null,
      estimatedTimeSeconds: 50,
    });
    // Equal output, one side has no gas data -> falls through to time tie-break, not gas.
    const ranked = rankRoutes([reportsGas, noGasData], "bestReturn");
    expect(ranked.map((r) => r.routeId)).toEqual(["noGasData", "reportsGas"]);
  });
});

describe("rankRoutes fastest", () => {
  it("orders by estimatedTimeSeconds ascending", () => {
    const slow = quote({ routeId: "slow", estimatedTimeSeconds: 600 });
    const fast = quote({ routeId: "fast", estimatedTimeSeconds: 60 });
    const ranked = rankRoutes([slow, fast], "fastest");
    expect(ranked.map((r) => r.routeId)).toEqual(["fast", "slow"]);
  });

  it("always puts null estimatedTimeSeconds last", () => {
    const unknown = quote({ routeId: "unknown", estimatedTimeSeconds: null });
    const known = quote({ routeId: "known", estimatedTimeSeconds: 99999 });
    const ranked = rankRoutes([unknown, known], "fastest");
    expect(ranked.map((r) => r.routeId)).toEqual(["known", "unknown"]);
  });
});

describe("rankRoutes lowestCost", () => {
  it("orders by providerFeeAmount + platformFeeAmount ascending", () => {
    const cheap = quote({ routeId: "cheap", providerFeeAmount: "100", platformFeeAmount: "10000" });
    const expensive = quote({
      routeId: "expensive",
      providerFeeAmount: "50000",
      platformFeeAmount: "10000",
    });
    const ranked = rankRoutes([expensive, cheap], "lowestCost");
    expect(ranked.map((r) => r.routeId)).toEqual(["cheap", "expensive"]);
  });

  it("uses gasCostUsd as a tie-break when total fees are equal", () => {
    const cheapGas = quote({
      routeId: "cheapGas",
      providerFeeAmount: "1000",
      platformFeeAmount: "10000",
      gasCostUsd: 0.1,
    });
    const expensiveGas = quote({
      routeId: "expensiveGas",
      providerFeeAmount: "1000",
      platformFeeAmount: "10000",
      gasCostUsd: 3,
    });
    const ranked = rankRoutes([expensiveGas, cheapGas], "lowestCost");
    expect(ranked.map((r) => r.routeId)).toEqual(["cheapGas", "expensiveGas"]);
  });
});
