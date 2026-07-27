import { fetchJson, ProviderError, type FetchResult } from "@/lib/market/http.server";
import { selectFeeToken } from "./fees";
import { serverFeeBps, serverFeeRecipient } from "./feeConfig.server";

const BASE_URL = "https://api.0x.org";
const ROBINHOOD_CHAIN_ID = 4663;

export function zeroExConfigured(): boolean {
  return Boolean((process.env.ZEROX_API_KEY ?? "").trim()) && serverFeeRecipient() !== null;
}

export interface ZeroExRequestParams {
  sellToken: string;
  buyToken: string;
  sellAmount?: string;
  buyAmount?: string;
  taker?: string;
  slippageBps?: number;
}

/**
 * Builds the outbound query string. chainId, swapFeeRecipient, swapFeeBps,
 * and swapFeeToken are computed here and ONLY here — this function's caller
 * (the two /api/swap/* route handlers) has no way to pass values for any of
 * these four fields, because their Zod request schemas don't define them.
 */
function buildQuery(params: ZeroExRequestParams): URLSearchParams {
  const feeRecipient = serverFeeRecipient();
  if (!feeRecipient) {
    throw new Error(
      "buildQuery called without a configured fee recipient — call zeroExConfigured() first",
    );
  }
  const feeBps = serverFeeBps();
  const feeToken = selectFeeToken(params.sellToken, params.buyToken);

  const query = new URLSearchParams({
    chainId: String(ROBINHOOD_CHAIN_ID),
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    swapFeeRecipient: feeRecipient,
    swapFeeBps: String(feeBps),
    swapFeeToken: feeToken,
    slippageBps: String(params.slippageBps ?? 100),
  });

  if (params.sellAmount) query.set("sellAmount", params.sellAmount);
  if (params.buyAmount) query.set("buyAmount", params.buyAmount);
  if (params.taker) query.set("taker", params.taker);

  return query;
}

/**
 * 0x returns a structured { name, message } body for request-level rejections
 * (confirmed live: SELL_TOKEN_NOT_AUTHORIZED_FOR_TRADE for every one of this
 * app's tokenized-equity tokens — a permanent regulatory restriction on 0x's
 * side, not a transient failure). Recognized so the UI can show 0x's own
 * accurate reason instead of a generic "temporarily unavailable" message that
 * wrongly implies retrying might help.
 */
function is0xNamedError(body: unknown): body is { name: string; message: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as Record<string, unknown>).name === "string" &&
    typeof (body as Record<string, unknown>).message === "string"
  );
}

async function callZeroEx(
  path: string,
  params: ZeroExRequestParams,
  cacheKey: string,
  ttlSeconds: number,
): Promise<FetchResult<unknown>> {
  const query = buildQuery(params);
  const url = `${BASE_URL}${path}?${query.toString()}`;

  try {
    return await fetchJson<unknown>(url, {
      provider: "zeroex",
      cacheKey,
      ttlSeconds,
      timeoutMs: 10_000,
      retries: 1,
      headers: {
        "0x-api-key": process.env.ZEROX_API_KEY ?? "",
        "0x-version": "v2",
      },
    });
  } catch (error) {
    if (error instanceof ProviderError && is0xNamedError(error.body)) {
      // error.body.message is 0x's own documented, user-safe explanatory
      // text (not an internal detail) — surfaced verbatim rather than
      // collapsed into a generic "temporarily unavailable" message.
      throw new ProviderError("rejected", error.body.message, 422, error.body);
    }
    throw error;
  }
}

/** Indicative price — no wallet signature required, used for pre-flight $20/$0.02 checks. */
export function fetchZeroExPrice(params: ZeroExRequestParams): Promise<FetchResult<unknown>> {
  const cacheKey = `zeroex:price:${params.sellToken}:${params.buyToken}:${params.sellAmount ?? params.buyAmount}:${params.taker ?? ""}:${params.slippageBps ?? ""}`;
  return callZeroEx("/swap/allowance-holder/price", params, cacheKey, 3);
}

/** Firm, executable quote — never cached (must always be fresh for on-chain execution). */
export function fetchZeroExQuote(
  params: ZeroExRequestParams & { taker: string },
): Promise<FetchResult<unknown>> {
  const cacheKey = `zeroex:quote:${params.sellToken}:${params.buyToken}:${params.sellAmount ?? params.buyAmount}:${params.taker}:${Date.now()}`;
  return callZeroEx("/swap/allowance-holder/quote", params, cacheKey, 0);
}
