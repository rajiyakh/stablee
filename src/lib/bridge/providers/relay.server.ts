import { fetchJson, recordFailure, recordSuccess } from "@/lib/market/http.server";
import { assertAllowedHost } from "../allowlist";
import { bridgeFeeBps, bridgeTreasuryAddress } from "../feeConfig.server";
import { isNativeAddress, normalizeRelayQuote, toCanonicalNativeSentinel } from "../normalize";
import {
  relayChainsResponseSchema,
  relayCurrenciesResponseSchema,
  relayQuoteResponseSchema,
  relayStatusResponseSchema,
} from "./schemas/relay";
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

const BASE_URL = "https://api.relay.link";
/** Relay's own convention for "the chain's native asset". */
const RELAY_NATIVE_ADDRESS = "0x0000000000000000000000000000000000000000";

function fromCanonicalNative(address: string): string {
  return isNativeAddress(address) ? RELAY_NATIVE_ADDRESS : address;
}

function apiKey(): string {
  return (process.env.RELAY_API_KEY ?? "").trim();
}

function relayEnabled(): boolean {
  return (process.env.RELAY_ENABLED ?? "").trim() === "true";
}

/** Relay's own App Fee mechanism is only actually requested once the owner confirms it's configured on their side. */
function appFeeConfirmed(): boolean {
  return (process.env.RELAY_APP_FEE_CONFIRMED ?? "").trim() === "true";
}

export function relayConfigured(): boolean {
  return relayEnabled() && Boolean(apiKey()) && bridgeTreasuryAddress() !== null;
}

function feeMode(): FeeCollectionMode {
  return relayConfigured() && appFeeConfirmed() ? "provider-native" : "unavailable";
}

async function getSupportedChains(): Promise<SupportedChain[]> {
  try {
    const url = `${BASE_URL}/chains`;
    assertAllowedHost("relay", url);
    const result = await fetchJson<unknown>(url, {
      provider: "relay",
      cacheKey: "relay:chains",
      ttlSeconds: 600,
      timeoutMs: 10_000,
    });
    const parsed = relayChainsResponseSchema.parse(result.data);
    recordSuccess("relay");
    return parsed.chains.map((chain) => ({
      chainId: chain.id,
      providerKey: chain.name,
      name: chain.displayName ?? chain.name,
      nativeCurrency: {
        symbol: chain.currency?.symbol ?? "ETH",
        decimals: chain.currency?.decimals ?? 18,
      },
      explorerUrl: chain.explorerUrl ?? null,
      riskNote: null,
    }));
  } catch (error) {
    recordFailure("relay", error instanceof Error ? error.message : "getSupportedChains failed");
    return [];
  }
}

async function getSupportedTokens(chainId: number): Promise<SupportedToken[]> {
  try {
    const url = `${BASE_URL}/currencies/v1`;
    assertAllowedHost("relay", url);
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chainIds: [chainId], verified: true, limit: 100 }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      recordFailure("relay", `Relay currencies responded with ${response.status}`);
      return [];
    }
    const raw = await response.json();
    recordSuccess("relay");
    const parsed = relayCurrenciesResponseSchema.parse(raw);
    return parsed.flat().map((token) => ({
      chainId: token.chainId,
      address: token.metadata?.isNative ? toCanonicalNativeSentinel(token.address) : token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      logoUrl: token.metadata?.logoURI ?? null,
      priceUsd: null,
    }));
  } catch (error) {
    recordFailure("relay", error instanceof Error ? error.message : "getSupportedTokens failed");
    return [];
  }
}

function feeAmountRecipient(): { recipient: string; fee: string } | null {
  const treasury = bridgeTreasuryAddress();
  if (!treasury) return null;
  return { recipient: treasury, fee: String(bridgeFeeBps()) };
}

/** Returns null (never throws) whenever Relay has no route for this pair — "no route" is not an error. */
async function getQuoteImpl(params: BridgeQuoteParams): Promise<NormalizedBridgeQuote | null> {
  if (!relayConfigured()) return null;

  const body: Record<string, unknown> = {
    user: params.sender,
    recipient: params.recipient,
    originChainId: params.fromChainId,
    destinationChainId: params.toChainId,
    originCurrency: fromCanonicalNative(params.fromToken),
    destinationCurrency: fromCanonicalNative(params.toToken),
    amount: params.fromAmount,
    tradeType: "EXACT_INPUT",
  };
  if (params.slippageBps) body.slippageTolerance = String(params.slippageBps);
  // Relay's App Fee is only requested once the owner has confirmed it's
  // actually configured on Relay's side — never sent speculatively.
  const feeRecipient = appFeeConfirmed() ? feeAmountRecipient() : null;
  if (feeRecipient) body.appFees = [feeRecipient];

  try {
    const url = `${BASE_URL}/quote/v2`;
    assertAllowedHost("relay", url);
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey()}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      recordFailure("relay", `Relay quote responded with ${response.status}`);
      return null;
    }
    const raw = await response.json();
    recordSuccess("relay");
    const parsed = relayQuoteResponseSchema.parse(raw);

    return normalizeRelayQuote(parsed, {
      params,
      fromToken: resolveTokenFromDetails(parsed, "in", params),
      toToken: resolveTokenFromDetails(parsed, "out", params),
      feeBps: bridgeFeeBps(),
    });
  } catch (error) {
    recordFailure("relay", error instanceof Error ? error.message : "getQuote failed");
    return null;
  }
}

function resolveTokenFromDetails(
  parsed: ReturnType<typeof relayQuoteResponseSchema.parse>,
  side: "in" | "out",
  params: BridgeQuoteParams,
): SupportedToken {
  const detail = side === "in" ? parsed.details?.currencyIn : parsed.details?.currencyOut;
  const fallbackAddress = side === "in" ? params.fromToken : params.toToken;
  const fallbackChainId = side === "in" ? params.fromChainId : params.toChainId;
  if (detail?.currency) {
    return {
      chainId: detail.currency.chainId,
      address: toCanonicalNativeSentinel(detail.currency.address),
      symbol: detail.currency.symbol,
      name: detail.currency.symbol,
      decimals: detail.currency.decimals,
      logoUrl: null,
      priceUsd: null,
    };
  }
  // Details weren't present in the response — fall back to what we know we
  // requested, with decimals unknown (0 rather than a guessed value; any
  // downstream display of the amount must treat this as untrusted).
  return {
    chainId: fallbackChainId,
    address: toCanonicalNativeSentinel(fallbackAddress),
    symbol: "",
    name: "",
    decimals: 0,
    logoUrl: null,
    priceUsd: null,
  };
}

function executeQuote(quote: NormalizedBridgeQuote): {
  to: string;
  data: string;
  value: string;
  chainId: number;
} {
  if (!quote.transactionRequest) {
    throw new Error(
      "Relay quote has no transactionRequest — call getQuote again before executing.",
    );
  }
  return quote.transactionRequest;
}

async function getTransactionStatus(args: {
  routeId: string;
  txHash: string;
  fromChainId: number;
  toChainId: number;
}): Promise<BridgeTransactionStatus> {
  try {
    // Relay's status endpoint keys off requestId (captured as routeId by
    // normalizeRelayQuote when present), not the transaction hash.
    const url = `${BASE_URL}/intents/status?requestId=${encodeURIComponent(args.routeId)}`;
    assertAllowedHost("relay", url);
    const result = await fetchJson<unknown>(url, {
      provider: "relay",
      cacheKey: `relay:status:${args.routeId}`,
      ttlSeconds: 5,
      timeoutMs: 10_000,
    });
    const parsed = relayStatusResponseSchema.parse(result.data);
    recordSuccess("relay");

    const category =
      parsed.status === "success"
        ? "destination_confirmed"
        : parsed.status === "failure"
          ? "failed"
          : parsed.status === "fallback"
            ? "refunded"
            : parsed.status === "pending"
              ? "bridging"
              : "pending";

    const destinationTxHash = parsed.txHashes?.[0] ?? null;

    return {
      state: mapProviderStatus({ category, destinationConfirmed: Boolean(destinationTxHash) }),
      sourceTxHash: parsed.inTxHashes?.[0] ?? args.txHash,
      sourceExplorerUrl: null,
      destinationTxHash,
      destinationExplorerUrl: null,
      providerTrackingUrl: null,
      receivedAmount: null,
      substatusMessage: null,
    };
  } catch (error) {
    recordFailure("relay", error instanceof Error ? error.message : "getTransactionStatus failed");
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

export const relayAdapter: BridgeAdapter = {
  id: "relay",
  displayName: "Relay",
  configured: relayConfigured,
  feeMode,
  getSupportedChains,
  getSupportedTokens,
  getQuote: getQuoteImpl,
  executeQuote,
  getTransactionStatus,
};
