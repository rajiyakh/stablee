import { fetchJson, ProviderError, recordFailure, recordSuccess } from "@/lib/market/http.server";
import { assertAllowedHost } from "../allowlist";
import { bridgeFeeBps, bridgeTreasuryAddress } from "../feeConfig.server";
import { isNativeAddress, normalizeAcrossQuote, toCanonicalNativeSentinel } from "../normalize";
import {
  acrossChainsResponseSchema,
  acrossQuoteResponseSchema,
  acrossStatusResponseSchema,
  acrossTokensResponseSchema,
} from "./schemas/across";
import { mapProviderStatus } from "../status";
import type {
  BridgeAdapter,
  BridgeQuoteParams,
  BridgeTransactionStatus,
  FeeCollectionMode,
  NormalizedBridgeQuote,
  SupportedChain,
  SupportedToken,
} from "../types";

const BASE_URL = "https://app.across.to/api";
/** Across's own convention for "the chain's native asset" — confirmed live in a real token listing. */
const ACROSS_NATIVE_ADDRESS = "0x0000000000000000000000000000000000000000";

function fromCanonicalNative(address: string): string {
  return isNativeAddress(address) ? ACROSS_NATIVE_ADDRESS : address;
}

function apiKey(): string {
  return (process.env.ACROSS_API_KEY ?? "").trim();
}

function integratorId(): string {
  return (process.env.ACROSS_INTEGRATOR_ID ?? "").trim();
}

function acrossEnabled(): boolean {
  return (process.env.ACROSS_ENABLED ?? "").trim() === "true";
}

/** Across's own App Fee mechanism is only actually requested once the owner confirms it's configured on their side. */
function appFeeConfirmed(): boolean {
  return (process.env.ACROSS_APP_FEE_CONFIRMED ?? "").trim() === "true";
}

export function acrossConfigured(): boolean {
  return (
    acrossEnabled() &&
    Boolean(apiKey()) &&
    Boolean(integratorId()) &&
    bridgeTreasuryAddress() !== null
  );
}

function feeMode(): FeeCollectionMode {
  return acrossConfigured() && appFeeConfirmed() ? "provider-native" : "unavailable";
}

function authHeaders(): Record<string, string> {
  return { authorization: `Bearer ${apiKey()}` };
}

async function callAcross<T>(
  path: string,
  params: Record<string, string>,
  cacheKey: string,
  ttlSeconds: number,
) {
  const query = new URLSearchParams({ ...params, integratorId: integratorId() });
  const url = `${BASE_URL}${path}?${query.toString()}`;
  assertAllowedHost("across", url);
  return fetchJson<T>(url, {
    provider: "across",
    cacheKey,
    ttlSeconds,
    timeoutMs: 10_000,
    retries: 1,
    headers: authHeaders(),
  });
}

/**
 * Quotes are per-wallet, per-amount and must never be cached — but
 * fetchJson's shared cache (callAcross's path) always writes an entry even
 * at ttlSeconds: 0, permanently occupying a slot in the 400-entry LRU with
 * an amount+sender+recipient-unique key that will never be read again.
 * Bypassing fetchJson for this one call avoids polluting the cache other
 * providers' genuinely cacheable chains/tokens responses share.
 */
async function fetchAcrossQuote(query: Record<string, string>): Promise<unknown> {
  const url = `${BASE_URL}/swap/approval?${new URLSearchParams({ ...query, integratorId: integratorId() }).toString()}`;
  assertAllowedHost("across", url);
  const response = await fetch(url, {
    headers: { accept: "application/json", ...authHeaders() },
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) {
    throw new ProviderError("not_found", "Resource not found", 404);
  }
  if (!response.ok) {
    throw new ProviderError("provider_error", `Provider responded with ${response.status}`, 502);
  }
  return response.json();
}

async function getSupportedChains(): Promise<SupportedChain[]> {
  try {
    const result = await callAcross<unknown>("/swap/chains", {}, "across:chains", 600);
    const chains = acrossChainsResponseSchema.parse(result.data);
    recordSuccess("across");
    return chains.map((chain) => ({
      chainId: chain.chainId,
      providerKey: String(chain.chainId),
      name: chain.name,
      nativeCurrency: { symbol: "ETH", decimals: 18 },
      explorerUrl: chain.explorerUrl ?? null,
      riskNote: null,
    }));
  } catch (error) {
    recordFailure("across", error instanceof Error ? error.message : "getSupportedChains failed");
    return [];
  }
}

async function getSupportedTokens(chainId: number): Promise<SupportedToken[]> {
  try {
    const result = await callAcross<unknown>(
      "/swap/tokens",
      { chainId: String(chainId) },
      `across:tokens:${chainId}`,
      600,
    );
    const tokens = acrossTokensResponseSchema.parse(result.data);
    recordSuccess("across");
    return tokens.map((token) => ({
      chainId: token.chainId,
      address: toCanonicalNativeSentinel(token.address),
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      logoUrl: token.logoUrl ?? null,
      priceUsd: token.priceUsd ? Number(token.priceUsd) : null,
    }));
  } catch (error) {
    recordFailure("across", error instanceof Error ? error.message : "getSupportedTokens failed");
    return [];
  }
}

/** Returns null (never throws) whenever Across has no route for this pair — "no route" is not an error. */
async function getQuoteImpl(params: BridgeQuoteParams): Promise<NormalizedBridgeQuote | null> {
  if (!acrossConfigured()) return null;

  const query: Record<string, string> = {
    originChainId: String(params.fromChainId),
    destinationChainId: String(params.toChainId),
    inputToken: fromCanonicalNative(params.fromToken),
    outputToken: fromCanonicalNative(params.toToken),
    amount: params.fromAmount,
    depositor: params.sender,
    recipient: params.recipient,
  };
  // Across's app-fee params are only sent once the owner has confirmed
  // RobinPulse's app fee is actually configured on their side — never sent
  // speculatively, so we never receive (and then have to distrust) a fee
  // number for a mechanism that isn't really wired up.
  if (appFeeConfirmed()) {
    query.appFeeBps = String(bridgeFeeBps());
    const treasury = bridgeTreasuryAddress();
    if (treasury) query.appFeeRecipient = treasury;
  }

  try {
    const raw = await fetchAcrossQuote(query);
    const parsed = acrossQuoteResponseSchema.parse(raw);
    recordSuccess("across");

    return normalizeAcrossQuote(parsed, {
      params,
      fromToken: {
        chainId: parsed.inputToken.chainId,
        address: toCanonicalNativeSentinel(parsed.inputToken.address),
        symbol: parsed.inputToken.symbol,
        name: parsed.inputToken.name ?? parsed.inputToken.symbol,
        decimals: parsed.inputToken.decimals,
        logoUrl: null,
        priceUsd: null,
      },
      toToken: {
        chainId: parsed.outputToken.chainId,
        address: toCanonicalNativeSentinel(parsed.outputToken.address),
        symbol: parsed.outputToken.symbol,
        name: parsed.outputToken.name ?? parsed.outputToken.symbol,
        decimals: parsed.outputToken.decimals,
        logoUrl: null,
        priceUsd: null,
      },
      feeBps: bridgeFeeBps(),
    });
  } catch (error) {
    if (error instanceof ProviderError && error.status === 404) return null;
    recordFailure("across", error instanceof Error ? error.message : "getQuote failed");
    return null;
  }
}

function executeQuote(quote: NormalizedBridgeQuote): {
  to: string;
  data: string;
  value: string;
  chainId: number;
} {
  if (!quote.transactionRequest) {
    throw new Error(
      "Across quote has no transactionRequest — call getQuote again before executing.",
    );
  }
  return quote.transactionRequest;
}

/**
 * Status-endpoint path/shape was not confirmed live during planning (see
 * docs/BRIDGE_SETUP.md) — any failure degrades to a generic "submitted,
 * status unavailable" state rather than throwing, exactly like lifi.server.ts.
 */
async function getTransactionStatus(args: {
  routeId: string;
  txHash: string;
  fromChainId: number;
  toChainId: number;
}): Promise<BridgeTransactionStatus> {
  try {
    const result = await callAcross<unknown>(
      "/deposit/status",
      { originChainId: String(args.fromChainId), depositTxHash: args.txHash },
      `across:status:${args.txHash}`,
      5,
    );
    const parsed = acrossStatusResponseSchema.parse(result.data);
    recordSuccess("across");
    const category =
      parsed.status === "filled"
        ? "destination_confirmed"
        : parsed.status === "refunded"
          ? "refunded"
          : parsed.status === "expired"
            ? "failed"
            : "bridging";

    return {
      state: mapProviderStatus({ category, destinationConfirmed: Boolean(parsed.fillTx) }),
      sourceTxHash: args.txHash,
      sourceExplorerUrl: null,
      destinationTxHash: parsed.fillTx ?? null,
      destinationExplorerUrl: null,
      providerTrackingUrl: null,
      receivedAmount: null,
      substatusMessage: null,
    };
  } catch (error) {
    recordFailure("across", error instanceof Error ? error.message : "getTransactionStatus failed");
    return {
      state: "submitted",
      sourceTxHash: args.txHash,
      sourceExplorerUrl: null,
      destinationTxHash: null,
      destinationExplorerUrl: null,
      providerTrackingUrl: null,
      receivedAmount: null,
      substatusMessage: "Status temporarily unavailable.",
    };
  }
}

export const acrossAdapter: BridgeAdapter = {
  id: "across",
  displayName: "Across",
  configured: acrossConfigured,
  feeMode,
  getSupportedChains,
  getSupportedTokens,
  getQuote: getQuoteImpl,
  executeQuote,
  getTransactionStatus,
};
