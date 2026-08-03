import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchJsonMock = vi.fn();

vi.mock("@/lib/market/http.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/market/http.server")>();
  return {
    ...actual,
    fetchJson: (...args: unknown[]) => fetchJsonMock(...args),
  };
});

const ORIGINAL_ENV = { ...process.env };

const params = {
  fromChainId: 1,
  toChainId: 4663,
  fromToken: "0xfromtoken0000000000000000000000000000",
  toToken: "0xtotoken00000000000000000000000000000000",
  fromAmount: "1000000",
  sender: "0xsender000000000000000000000000000000000",
  recipient: "0xsender000000000000000000000000000000000",
  slippageBps: null,
};

function setConfigured() {
  process.env.ACROSS_ENABLED = "true";
  process.env.ACROSS_API_KEY = "test-key";
  process.env.ACROSS_INTEGRATOR_ID = "robinpulse";
  process.env.ROBINPULSE_TREASURY_ADDRESS = "0x0bd7d308f8e1639fab988df18a8011f41eacad72";
  process.env.BRIDGE_PLATFORM_FEE_BPS = "100";
}

beforeEach(() => {
  vi.resetModules();
  fetchJsonMock.mockReset();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.ACROSS_ENABLED;
  delete process.env.ACROSS_API_KEY;
  delete process.env.ACROSS_INTEGRATOR_ID;
  delete process.env.ACROSS_APP_FEE_CONFIRMED;
  delete process.env.ROBINPULSE_TREASURY_ADDRESS;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function validApprovalResponse() {
  return {
    id: "across-1",
    inputAmount: "1000000",
    expectedOutputAmount: "989000",
    minOutputAmount: "980000",
    expectedFillTime: 90,
    inputToken: {
      chainId: 1,
      address: params.fromToken,
      symbol: "USDC",
      decimals: 6,
      name: "USD Coin",
    },
    outputToken: {
      chainId: 4663,
      address: params.toToken,
      symbol: "USDG",
      decimals: 6,
      name: "Global Dollar",
    },
    fees: {
      total: {
        amount: "11500",
        details: {
          app: { amount: "10000" },
          bridge: {
            amount: "1500",
            details: { lp: { amount: "1000" }, relayerCapital: { amount: "500" } },
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

describe("acrossAdapter.configured", () => {
  it("is false with no env configured", async () => {
    const { acrossAdapter } = await import("./across.server");
    expect(acrossAdapter.configured()).toBe(false);
  });

  it("is true once enabled + api key + integrator id + treasury are present", async () => {
    setConfigured();
    const { acrossAdapter } = await import("./across.server");
    expect(acrossAdapter.configured()).toBe(true);
  });
});

describe("acrossAdapter.feeMode", () => {
  it("is unavailable when configured but ACROSS_APP_FEE_CONFIRMED is not set", async () => {
    setConfigured();
    const { acrossAdapter } = await import("./across.server");
    expect(acrossAdapter.feeMode()).toBe("unavailable");
  });

  it("is provider-native once ACROSS_APP_FEE_CONFIRMED is true", async () => {
    setConfigured();
    process.env.ACROSS_APP_FEE_CONFIRMED = "true";
    const { acrossAdapter } = await import("./across.server");
    expect(acrossAdapter.feeMode()).toBe("provider-native");
  });
});

describe("acrossAdapter.getQuote", () => {
  it("returns null without calling the API when not configured", async () => {
    const { acrossAdapter } = await import("./across.server");
    const result = await acrossAdapter.getQuote(params);
    expect(result).toBeNull();
    expect(fetchJsonMock).not.toHaveBeenCalled();
  });

  it("returns null (never throws) when the API call fails", async () => {
    setConfigured();
    fetchJsonMock.mockRejectedValue(new Error("no route"));
    const { acrossAdapter } = await import("./across.server");
    const result = await acrossAdapter.getQuote(params);
    expect(result).toBeNull();
  });

  it("only sends app-fee params once ACROSS_APP_FEE_CONFIRMED is true", async () => {
    setConfigured();
    fetchJsonMock.mockResolvedValue({
      data: validApprovalResponse(),
      fetchedAt: new Date().toISOString(),
      cached: false,
      stale: false,
    });
    const { acrossAdapter } = await import("./across.server");
    await acrossAdapter.getQuote(params);
    const calledUrl = fetchJsonMock.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("appFeeBps");
  });

  it("sends app-fee params once confirmed", async () => {
    setConfigured();
    process.env.ACROSS_APP_FEE_CONFIRMED = "true";
    fetchJsonMock.mockResolvedValue({
      data: validApprovalResponse(),
      fetchedAt: new Date().toISOString(),
      cached: false,
      stale: false,
    });
    const { acrossAdapter } = await import("./across.server");
    await acrossAdapter.getQuote(params);
    const calledUrl = fetchJsonMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("appFeeBps=100");
  });

  it("normalizes a successful response into a NormalizedBridgeQuote", async () => {
    setConfigured();
    fetchJsonMock.mockResolvedValue({
      data: validApprovalResponse(),
      fetchedAt: new Date().toISOString(),
      cached: false,
      stale: false,
    });
    const { acrossAdapter } = await import("./across.server");
    const result = await acrossAdapter.getQuote(params);
    expect(result?.provider).toBe("across");
    expect(result?.platformFeeAmount).toBe("10000");
  });
});
