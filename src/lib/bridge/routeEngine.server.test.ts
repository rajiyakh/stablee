import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdapterSupportCheck } from "./registry.server";
import type { BridgeAdapter, BridgeQuoteParams, NormalizedBridgeQuote } from "./types";

const adaptersSupportingRouteMock = vi.fn<(...args: unknown[]) => Promise<AdapterSupportCheck[]>>();

vi.mock("./registry.server", () => ({
  adaptersSupportingRoute: (...args: unknown[]) => adaptersSupportingRouteMock(...args),
}));

vi.mock("./feeConfig.server", () => ({
  bridgeFeeBps: () => 100,
  bridgeTreasuryAddress: () => "0x0bd7d308f8e1639fab988df18a8011f41eacad72",
}));

const params: BridgeQuoteParams = {
  fromChainId: 1,
  toChainId: 4663,
  fromToken: "0xfromtoken0000000000000000000000000000",
  toToken: "0xtotoken00000000000000000000000000000000",
  fromAmount: "1000000",
  sender: "0xsender000000000000000000000000000000000",
  recipient: "0xsender000000000000000000000000000000000",
  slippageBps: null,
};

function fakeQuote(
  overrides: Partial<NormalizedBridgeQuote> & { provider: NormalizedBridgeQuote["provider"] },
): NormalizedBridgeQuote {
  const fetchedAt = Date.now();
  return {
    routeId: `${overrides.provider}-route`,
    inputAmount: "1000000",
    platformFeeAmount: "10000",
    providerFeeAmount: "1000",
    gasCostUsd: null,
    estimatedOutputAmount: "989000",
    minimumReceived: "980000",
    estimatedTimeSeconds: 120,
    priceImpactPercent: 0,
    transactionRequest: {
      to: "0xTxTarget00000000000000000000000000000",
      data: "0xdead",
      value: "0",
      chainId: 1,
    },
    meta: {
      feeMode: "provider-native",
      fetchedAt,
      expiresAt: fetchedAt + 30_000,
      fromChainId: params.fromChainId,
      toChainId: params.toChainId,
      fromToken: {
        chainId: params.fromChainId,
        address: params.fromToken,
        symbol: "A",
        name: "A",
        decimals: 18,
        logoUrl: null,
        priceUsd: null,
      },
      toToken: {
        chainId: params.toChainId,
        address: params.toToken,
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

function fakeAdapter(id: BridgeAdapter["id"], getQuote: BridgeAdapter["getQuote"]): BridgeAdapter {
  return {
    id,
    displayName: id,
    configured: () => true,
    feeMode: () => "provider-native",
    getSupportedChains: async () => [],
    getSupportedTokens: async () => [],
    getQuote,
    executeQuote: (q) => q.transactionRequest!,
    getTransactionStatus: async () => ({
      state: "submitted",
      sourceTxHash: null,
      sourceExplorerUrl: null,
      destinationTxHash: null,
      destinationExplorerUrl: null,
      providerTrackingUrl: null,
      receivedAmount: null,
      substatusMessage: null,
    }),
  };
}

beforeEach(() => {
  adaptersSupportingRouteMock.mockReset();
});

describe("fetchBridgeRoutes", () => {
  it("one adapter rejecting never blocks the others", async () => {
    const { fetchBridgeRoutes } = await import("./routeEngine.server");
    const lifi = fakeAdapter("lifi", async () => {
      throw new Error("boom");
    });
    const across = fakeAdapter("across", async () => fakeQuote({ provider: "across" }));
    adaptersSupportingRouteMock.mockResolvedValue([
      { adapter: lifi, supported: true, reason: null },
      { adapter: across, supported: true, reason: null },
    ]);

    const result = await fetchBridgeRoutes(params);
    expect(result.routes).toHaveLength(1);
    expect(result.routes[0].provider).toBe("across");
    expect(result.excluded.some((e) => e.provider === "lifi")).toBe(true);
  });

  it("an adapter marked unsupported by the registry is never asked for a quote", async () => {
    const { fetchBridgeRoutes } = await import("./routeEngine.server");
    const getQuoteSpy = vi.fn();
    const relay = fakeAdapter("relay", getQuoteSpy);
    adaptersSupportingRouteMock.mockResolvedValue([
      { adapter: relay, supported: false, reason: "destination chain not supported" },
    ]);

    const result = await fetchBridgeRoutes(params);
    expect(getQuoteSpy).not.toHaveBeenCalled();
    expect(result.routes).toHaveLength(0);
    expect(result.excluded).toEqual([
      { provider: "relay", reason: "destination chain not supported" },
    ]);
  });

  it("excludes a quote with fee_mode_unavailable pre-ranking", async () => {
    const { fetchBridgeRoutes } = await import("./routeEngine.server");
    const gaszip = fakeAdapter("gaszip", async () =>
      fakeQuote({
        provider: "gaszip",
        meta: { ...fakeQuote({ provider: "gaszip" }).meta, feeMode: "unavailable" },
      }),
    );
    adaptersSupportingRouteMock.mockResolvedValue([
      { adapter: gaszip, supported: true, reason: null },
    ]);

    const result = await fetchBridgeRoutes(params);
    expect(result.routes).toHaveLength(0);
    expect(result.excluded[0].reason).toContain("fee_mode_unavailable");
  });

  it("excludes a quote with a missing platform fee pre-ranking (never fabricates one)", async () => {
    const { fetchBridgeRoutes } = await import("./routeEngine.server");
    const across = fakeAdapter("across", async () =>
      fakeQuote({ provider: "across", platformFeeAmount: "0" }),
    );
    adaptersSupportingRouteMock.mockResolvedValue([
      { adapter: across, supported: true, reason: null },
    ]);

    const result = await fetchBridgeRoutes(params);
    expect(result.routes).toHaveLength(0);
    expect(result.excluded[0].reason).toContain("fee_missing");
  });

  it("ranks surviving routes by the requested sort mode", async () => {
    const { fetchBridgeRoutes } = await import("./routeEngine.server");
    const lifi = fakeAdapter("lifi", async () =>
      fakeQuote({ provider: "lifi", estimatedOutputAmount: "900000" }),
    );
    const across = fakeAdapter("across", async () =>
      fakeQuote({ provider: "across", estimatedOutputAmount: "990000" }),
    );
    adaptersSupportingRouteMock.mockResolvedValue([
      { adapter: lifi, supported: true, reason: null },
      { adapter: across, supported: true, reason: null },
    ]);

    const result = await fetchBridgeRoutes(params, "bestReturn");
    expect(result.routes.map((r) => r.provider)).toEqual(["across", "lifi"]);
    expect(result.sortApplied).toBe("bestReturn");
  });

  it("returns a quote with a null-returning adapter as excluded, not as an error", async () => {
    const { fetchBridgeRoutes } = await import("./routeEngine.server");
    const relay = fakeAdapter("relay", async () => null);
    adaptersSupportingRouteMock.mockResolvedValue([
      { adapter: relay, supported: true, reason: null },
    ]);

    const result = await fetchBridgeRoutes(params);
    expect(result.routes).toHaveLength(0);
    expect(result.excluded[0].reason).toBe("no route for this pair");
  });
});
