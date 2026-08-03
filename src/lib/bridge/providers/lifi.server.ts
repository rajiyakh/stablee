import { createClient, getChains, getQuote, getStatus, getTokens } from "@lifi/sdk";
import { recordFailure, recordSuccess } from "@/lib/market/http.server";
import { bridgeFeeBps, bridgeTreasuryAddress } from "../feeConfig.server";
import { normalizeLifiQuote } from "../normalize";
import { isNativeAddress, toCanonicalNativeSentinel } from "../normalize";
import { lifiQuoteResponseSchema, lifiStatusResponseSchema } from "./schemas/lifi";
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

/** LI.FI's own convention for "the chain's native asset" in request/response payloads. */
const LIFI_NATIVE_ADDRESS = "0x0000000000000000000000000000000000000000";

function fromCanonicalNative(address: string): string {
  return isNativeAddress(address) ? LIFI_NATIVE_ADDRESS : address;
}

function integrator(): string {
  return (process.env.LIFI_INTEGRATOR ?? "").trim();
}

function apiKey(): string {
  return (process.env.LIFI_API_KEY ?? "").trim();
}

function lifiEnabled(): boolean {
  return (process.env.LIFI_ENABLED ?? "").trim() === "true";
}

export function lifiConfigured(): boolean {
  return (
    lifiEnabled() && Boolean(apiKey()) && Boolean(integrator()) && bridgeTreasuryAddress() !== null
  );
}

let cachedClient: ReturnType<typeof createClient> | undefined;

/**
 * SDK client is built lazily and cached — never at module import time, so a
 * missing API key never throws for every route that happens to import this
 * file. apiUrl is deliberately never overridden here, so the SDK always
 * talks to its own real default endpoint regardless of env — no base-URL
 * override can redirect bridge traffic elsewhere.
 */
function client() {
  if (cachedClient) return cachedClient;
  cachedClient = createClient({ integrator: integrator(), apiKey: apiKey() });
  return cachedClient;
}

function tokenToSupportedToken(token: {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string | null;
  priceUSD?: string | null;
}): SupportedToken {
  return {
    chainId: token.chainId,
    address: toCanonicalNativeSentinel(token.address),
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoUrl: token.logoURI ?? null,
    priceUsd: token.priceUSD ? Number(token.priceUSD) : null,
  };
}

async function getSupportedChains(): Promise<SupportedChain[]> {
  try {
    const chains = await getChains(client());
    recordSuccess("lifi");
    return chains.map((chain) => ({
      chainId: chain.id,
      providerKey: chain.key,
      name: chain.name,
      nativeCurrency: { symbol: chain.nativeToken.symbol, decimals: chain.nativeToken.decimals },
      explorerUrl: null,
      riskNote: null,
    }));
  } catch (error) {
    recordFailure("lifi", error instanceof Error ? error.message : "getChains failed");
    return [];
  }
}

async function getSupportedTokens(chainId: number): Promise<SupportedToken[]> {
  try {
    const response = await getTokens(client(), { chains: [chainId] });
    recordSuccess("lifi");
    return (response.tokens[chainId] ?? []).map(tokenToSupportedToken);
  } catch (error) {
    recordFailure("lifi", error instanceof Error ? error.message : "getTokens failed");
    return [];
  }
}

function feeMode(): FeeCollectionMode {
  return lifiConfigured() ? "provider-native" : "unavailable";
}

/**
 * Returns null (never throws) whenever LI.FI has no route for this pair —
 * "no route" is not an error. Configuration problems (missing key/
 * integrator/treasury) are checked by the caller (registry.server.ts) via
 * configured()/feeMode() before this is ever invoked.
 */
async function getQuoteImpl(params: BridgeQuoteParams): Promise<NormalizedBridgeQuote | null> {
  if (!lifiConfigured()) return null;

  try {
    const raw = await getQuote(client(), {
      fromChain: params.fromChainId,
      toChain: params.toChainId,
      fromToken: fromCanonicalNative(params.fromToken),
      toToken: fromCanonicalNative(params.toToken),
      fromAddress: params.sender,
      toAddress: params.recipient,
      fromAmount: params.fromAmount,
      integrator: integrator(),
      // computeBridgeFeeBps() is baked into bridgeFeeBps() — never a literal
      // 0.01, so the hardcoded ceiling in fee.ts actually governs the wire
      // request, not just display math.
      fee: bridgeFeeBps() / 10_000,
      slippage: params.slippageBps ? params.slippageBps / 10_000 : undefined,
    });

    recordSuccess("lifi");
    const parsed = lifiQuoteResponseSchema.parse(raw);

    return normalizeLifiQuote(parsed, {
      params,
      fromToken: tokenToSupportedToken(parsed.action.fromToken),
      toToken: tokenToSupportedToken(parsed.action.toToken),
      feeBps: bridgeFeeBps(),
    });
  } catch (error) {
    // A no-route response and a transient upstream failure both surface as
    // "no quote from this provider right now" — routeEngine.server.ts
    // records the exclusion reason from configured()/feeMode() state
    // separately, so this never masks a real configuration problem.
    recordFailure("lifi", error instanceof Error ? error.message : "getQuote failed");
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
      "LI.FI quote has no transactionRequest — call getQuote again before executing.",
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
    const raw = await getStatus(client(), {
      txHash: args.txHash,
      fromChain: args.fromChainId,
      toChain: args.toChainId,
    });
    recordSuccess("lifi");
    const parsed = lifiStatusResponseSchema.parse(raw);

    const destinationTxHash =
      typeof parsed.receiving === "object" && parsed.receiving && "txHash" in parsed.receiving
        ? ((parsed.receiving as { txHash?: string | null }).txHash ?? null)
        : null;

    const category =
      parsed.status === "DONE"
        ? "destination_confirmed"
        : parsed.status === "FAILED"
          ? "failed"
          : parsed.substatus === "WAIT_DESTINATION_TRANSACTION"
            ? "bridging"
            : parsed.substatus === "REFUND_IN_PROGRESS"
              ? "refund_pending"
              : parsed.sending?.txHash
                ? "source_confirmed"
                : "pending";

    return {
      state: mapProviderStatus({ category, destinationConfirmed: Boolean(destinationTxHash) }),
      sourceTxHash: parsed.sending?.txHash ?? null,
      sourceExplorerUrl: null,
      destinationTxHash,
      destinationExplorerUrl: null,
      providerTrackingUrl: parsed.lifiExplorerLink ?? null,
      receivedAmount:
        typeof parsed.receiving === "object" && parsed.receiving && "amount" in parsed.receiving
          ? ((parsed.receiving as { amount?: string | null }).amount ?? null)
          : null,
      substatusMessage: parsed.substatusMessage ?? null,
    };
  } catch (error) {
    recordFailure("lifi", error instanceof Error ? error.message : "getStatus failed");
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

export const lifiAdapter: BridgeAdapter = {
  id: "lifi",
  displayName: "LI.FI",
  configured: lifiConfigured,
  feeMode,
  getSupportedChains,
  getSupportedTokens,
  getQuote: getQuoteImpl,
  executeQuote,
  getTransactionStatus,
};
