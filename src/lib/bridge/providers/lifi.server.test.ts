import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getChainsMock = vi.fn();
const getTokensMock = vi.fn();
const getQuoteMock = vi.fn();
const getStatusMock = vi.fn();

// Real (not just typed) classes so `instanceof` checks in lifi.server.ts's
// catch block behave correctly against both a plain rejection and a genuine
// SDKError-wrapped-HTTPError (see the 401/404 tests below). Declared with
// vi.hoisted() (rather than imported from "@lifi/sdk", whose real
// constructors take unrelated arguments) so both the mock factory and the
// test bodies can reference the exact same simplified classes.
const { MockSDKError, MockHTTPError } = vi.hoisted(() => {
  class MockHTTPError extends Error {
    status: number;
    constructor(status: number) {
      super(`HTTP ${status}`);
      this.status = status;
    }
  }
  class MockSDKError extends Error {
    cause?: unknown;
  }
  return { MockSDKError, MockHTTPError };
});

vi.mock("@lifi/sdk", () => ({
  createClient: (config: unknown) => ({ config }),
  getChains: (...args: unknown[]) => getChainsMock(...args),
  getTokens: (...args: unknown[]) => getTokensMock(...args),
  getQuote: (...args: unknown[]) => getQuoteMock(...args),
  getStatus: (...args: unknown[]) => getStatusMock(...args),
  SDKError: MockSDKError,
  HTTPError: MockHTTPError,
}));

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
  process.env.LIFI_ENABLED = "true";
  process.env.LIFI_API_KEY = "test-key";
  process.env.LIFI_INTEGRATOR = "robinpulse";
  process.env.ROBINPULSE_TREASURY_ADDRESS = "0x0bd7d308f8e1639fab988df18a8011f41eacad72";
  process.env.BRIDGE_PLATFORM_FEE_BPS = "100";
}

beforeEach(() => {
  vi.resetModules();
  getChainsMock.mockReset();
  getTokensMock.mockReset();
  getQuoteMock.mockReset();
  getStatusMock.mockReset();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.LIFI_ENABLED;
  delete process.env.LIFI_API_KEY;
  delete process.env.LIFI_INTEGRATOR;
  delete process.env.LIFI_PAYOUT_CONFIRMED;
  delete process.env.ROBINPULSE_TREASURY_ADDRESS;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("lifiAdapter.configured", () => {
  it("is false with no env configured", async () => {
    const { lifiAdapter } = await import("./lifi.server");
    expect(lifiAdapter.configured()).toBe(false);
  });

  it("is true once enabled + api key + integrator + treasury are all present", async () => {
    setConfigured();
    const { lifiAdapter } = await import("./lifi.server");
    expect(lifiAdapter.configured()).toBe(true);
  });

  it('is false when LIFI_ENABLED is not exactly "true"', async () => {
    setConfigured();
    process.env.LIFI_ENABLED = "yes";
    const { lifiAdapter } = await import("./lifi.server");
    expect(lifiAdapter.configured()).toBe(false);
  });
});

describe("lifiAdapter.feeMode", () => {
  it("is unavailable when configured but LIFI_PAYOUT_CONFIRMED is not set", async () => {
    setConfigured();
    const { lifiAdapter } = await import("./lifi.server");
    expect(lifiAdapter.feeMode()).toBe("unavailable");
  });

  it("is provider-native once LIFI_PAYOUT_CONFIRMED is true", async () => {
    setConfigured();
    process.env.LIFI_PAYOUT_CONFIRMED = "true";
    const { lifiAdapter } = await import("./lifi.server");
    expect(lifiAdapter.feeMode()).toBe("provider-native");
  });

  it('is unavailable when LIFI_PAYOUT_CONFIRMED is set but not exactly "true"', async () => {
    setConfigured();
    process.env.LIFI_PAYOUT_CONFIRMED = "yes";
    const { lifiAdapter } = await import("./lifi.server");
    expect(lifiAdapter.feeMode()).toBe("unavailable");
  });
});

describe("lifiAdapter.getQuote", () => {
  it("returns null without calling the SDK when not configured", async () => {
    const { lifiAdapter } = await import("./lifi.server");
    const result = await lifiAdapter.getQuote(params);
    expect(result).toBeNull();
    expect(getQuoteMock).not.toHaveBeenCalled();
  });

  it("returns null (never throws) when the SDK reports no route", async () => {
    setConfigured();
    getQuoteMock.mockRejectedValue(new Error("No routes found"));
    const { lifiAdapter } = await import("./lifi.server");
    const result = await lifiAdapter.getQuote(params);
    expect(result).toBeNull();
  });

  it("returns null (not throws) when the wrapped HTTP failure is a 404 (LI.FI's own no-route classification)", async () => {
    setConfigured();
    const httpError = new MockHTTPError(404);
    const sdkError = new MockSDKError("HTTP 404");
    sdkError.cause = httpError;
    getQuoteMock.mockRejectedValue(sdkError);
    const { lifiAdapter } = await import("./lifi.server");
    const result = await lifiAdapter.getQuote(params);
    expect(result).toBeNull();
  });

  it("rethrows (does not silently return null) when the wrapped HTTP failure is a 401 — a broken API key must not look like 'no route'", async () => {
    setConfigured();
    const httpError = new MockHTTPError(401);
    const sdkError = new MockSDKError("HTTP 401");
    sdkError.cause = httpError;
    getQuoteMock.mockRejectedValue(sdkError);
    const { lifiAdapter } = await import("./lifi.server");
    await expect(lifiAdapter.getQuote(params)).rejects.toThrow();
  });

  it("sends fee derived from computeBridgeFeeBps, never a hardcoded 0.01", async () => {
    setConfigured();
    process.env.BRIDGE_PLATFORM_FEE_BPS = "50"; // 0.5%, deliberately not the 1% default
    getQuoteMock.mockResolvedValue(validLifiStep());
    const { lifiAdapter } = await import("./lifi.server");
    await lifiAdapter.getQuote(params);
    const sentParams = getQuoteMock.mock.calls[0][1];
    expect(sentParams.fee).toBeCloseTo(0.005);
    expect(sentParams.integrator).toBe("robinpulse");
  });

  it("normalizes a successful quote into a NormalizedBridgeQuote", async () => {
    setConfigured();
    getQuoteMock.mockResolvedValue(validLifiStep());
    const { lifiAdapter } = await import("./lifi.server");
    const result = await lifiAdapter.getQuote(params);
    expect(result?.provider).toBe("lifi");
    expect(result?.platformFeeAmount).toBe("10000");
  });
});

function validLifiStep() {
  return {
    id: "route-1",
    tool: "stargate",
    action: {
      fromChainId: 1,
      toChainId: 4663,
      fromToken: {
        address: params.fromToken,
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
        name: "USD Coin",
      },
      toToken: {
        address: params.toToken,
        symbol: "USDG",
        decimals: 6,
        chainId: 4663,
        name: "Global Dollar",
      },
      fromAmount: "1000000",
      toAddress: params.recipient,
    },
    estimate: {
      fromAmount: "1000000",
      toAmount: "989000",
      toAmountMin: "980000",
      approvalAddress: "0xApprovalTarget0000000000000000000000",
      feeCosts: [
        {
          name: "LI.FI Fee",
          token: { address: params.toToken, symbol: "USDG", decimals: 6 },
          amount: "10000",
          included: true,
          feeSplit: { lifiFee: "0", integratorFee: "10000" },
        },
      ],
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
