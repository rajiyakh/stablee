import { fetchJson, recordFailure, recordSuccess } from "@/lib/market/http.server";
import { assertAllowedHost } from "../allowlist";
import { gaszipChainsResponseSchema } from "./schemas/gaszip";
import { BRIDGE_NATIVE_SENTINEL } from "../types";
import type {
  BridgeAdapter,
  BridgeQuoteParams,
  BridgeTransactionStatus,
  FeeCollectionMode,
  NormalizedBridgeQuote,
  SupportedChain,
  SupportedToken,
} from "../types";

const BASE_URL = "https://backend.gas.zip/v2";

function gaszipEnabled(): boolean {
  return (process.env.GASZIP_ENABLED ?? "").trim() === "true";
}

/**
 * Gas.zip is a native-ETH gas-refuel drip service (send value on one
 * chain, receive small amounts split across one or more destination
 * chains) — not a general arbitrary-ERC20 bridge like the other three
 * providers, and it has no documented RobinPulse platform-fee mechanism.
 * Kept disabled by default (GASZIP_ENABLED=false) per the product-shape
 * mismatch and the mandatory-fee requirement: even if enabled, feeMode()
 * below always returns "unavailable", so this adapter can never produce a
 * fee-bearing route — see docs/BRIDGE_SETUP.md.
 */
export function gaszipConfigured(): boolean {
  return gaszipEnabled();
}

function feeMode(): FeeCollectionMode {
  return "unavailable";
}

async function getSupportedChains(): Promise<SupportedChain[]> {
  try {
    const url = `${BASE_URL}/chains`;
    assertAllowedHost("gaszip", url);
    const result = await fetchJson<unknown>(url, {
      provider: "gaszip",
      cacheKey: "gaszip:chains",
      ttlSeconds: 600,
      timeoutMs: 10_000,
    });
    const chains = gaszipChainsResponseSchema.parse(result.data);
    recordSuccess("gaszip");
    return chains
      .filter((chain) => chain.inbound)
      .map((chain) => ({
        chainId: chain.chain,
        providerKey: String(chain.short),
        name: chain.name,
        nativeCurrency: { symbol: chain.symbol, decimals: chain.decimals },
        explorerUrl: null,
        riskNote: null,
      }));
  } catch (error) {
    recordFailure("gaszip", error instanceof Error ? error.message : "getSupportedChains failed");
    return [];
  }
}

/** Gas.zip only ever moves the chain's native asset — never an arbitrary ERC-20. */
async function getSupportedTokens(chainId: number): Promise<SupportedToken[]> {
  const chains = await getSupportedChains();
  const chain = chains.find((c) => c.chainId === chainId);
  if (!chain) return [];
  return [
    {
      chainId,
      address: BRIDGE_NATIVE_SENTINEL,
      symbol: chain.nativeCurrency.symbol,
      name: chain.nativeCurrency.symbol,
      decimals: chain.nativeCurrency.decimals,
      logoUrl: null,
      priceUsd: null,
    },
  ];
}

/** Always null — feeMode() is permanently "unavailable" so no route from this adapter can ever carry the mandatory platform fee. */
async function getQuoteImpl(_params: BridgeQuoteParams): Promise<NormalizedBridgeQuote | null> {
  return null;
}

function executeQuote(_quote: NormalizedBridgeQuote): {
  to: string;
  data: string;
  value: string;
  chainId: number;
} {
  throw new Error(
    "Gas.zip never produces an executable quote (no fee mechanism) — this should never be called.",
  );
}

async function getTransactionStatus(args: {
  routeId: string;
  txHash: string;
  fromChainId: number;
  toChainId: number;
}): Promise<BridgeTransactionStatus> {
  return {
    state: "failed",
    sourceTxHash: args.txHash,
    sourceExplorerUrl: null,
    destinationTxHash: null,
    destinationExplorerUrl: null,
    providerTrackingUrl: null,
    receivedAmount: null,
    substatusMessage: "Gas.zip is not an active bridge route.",
  };
}

export const gaszipAdapter: BridgeAdapter = {
  id: "gaszip",
  displayName: "Gas.zip",
  configured: gaszipConfigured,
  feeMode,
  getSupportedChains,
  getSupportedTokens,
  getQuote: getQuoteImpl,
  executeQuote,
  getTransactionStatus,
};
