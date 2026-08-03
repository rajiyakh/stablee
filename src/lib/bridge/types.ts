/**
 * Bridge aggregation types (client-safe, no server imports). Mirrors the
 * split already used by src/lib/swap/*: this file only has types, no fetch,
 * no env reads.
 */

export type BridgeProviderId = "lifi" | "relay" | "across" | "gaszip";

/**
 * Cross-provider native-asset sentinel. Each provider uses its own address
 * for "the chain's native token" (some use 0x0000...0000, some use this
 * 0xEeee... convention) — normalize.ts translates. This is the same value
 * swapTokens.ts already uses for Robinhood Chain's native ETH, so the app
 * has one native-asset convention everywhere, not two.
 */
export const BRIDGE_NATIVE_SENTINEL = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export interface SupportedChain {
  chainId: number;
  /** The provider's own key/slug for this chain — LI.FI "out", Relay "robinhood". Never guessed. */
  providerKey: string;
  name: string;
  nativeCurrency: { symbol: string; decimals: number };
  explorerUrl: string | null;
  /** Provider's own risk annotation, surfaced verbatim when present (e.g. LI.FI flags chain
   *  4663 "Unverified (flagged by hypernative)"). Never suppressed, never invented. */
  riskNote: string | null;
}

export interface SupportedToken {
  chainId: number;
  /** BRIDGE_NATIVE_SENTINEL for the chain's native asset. */
  address: string;
  symbol: string;
  name: string;
  /** Always sourced from the provider's own token registry — never inherited from swapTokens.ts. */
  decimals: number;
  logoUrl: string | null;
  priceUsd: number | null;
}

export interface BridgeQuoteParams {
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  /** Base-unit integer string. */
  fromAmount: string;
  /** Connected wallet address — the sender/signer. */
  sender: string;
  /** Defaults to sender; may be a custom address the UI has warned about. */
  recipient: string;
  slippageBps: number | null;
}

/**
 * How RobinPulse's 1% is actually collected for a given quote.
 * "provider-native" = the provider's own fee mechanism carried it, and
 * platformFeeAmount below is read back from their response, never computed
 * and injected by us. "unavailable" = no confirmed mechanism exists for this
 * provider right now, so the route engine excludes the quote entirely rather
 * than showing it fee-free or bolting on a second fee-collection step.
 */
export type FeeCollectionMode = "provider-native" | "unavailable";

export interface BridgeRouteStep {
  type: "swap" | "bridge" | "protocol";
  /** Human-facing tool name, e.g. "Across", "Stargate", "Uniswap V3". */
  toolName: string;
  fromChainId: number;
  toChainId: number;
  fromToken: { symbol: string; address: string; decimals: number };
  toToken: { symbol: string; address: string; decimals: number };
  fromAmount: string;
  toAmount: string;
  estimatedTimeSeconds: number | null;
}

export interface BridgeQuoteMeta {
  feeMode: FeeCollectionMode;
  /** Epoch ms, server-set at fetch time. */
  fetchedAt: number;
  /** min(provider's own expiry when known, fetchedAt + BRIDGE_QUOTE_TTL_MS). */
  expiresAt: number;
  fromChainId: number;
  toChainId: number;
  fromToken: SupportedToken;
  toToken: SupportedToken;
  /** Provider-echoed recipient address, when the response includes one. Compared
   *  against the request in validateBridgeQuote(); null means unverifiable, never assumed. */
  recipientEchoed: string | null;
  steps: BridgeRouteStep[];
  /** Provider's own status/tracking URL for this route, when supplied. */
  trackingUrl: string | null;
  requiresApproval: boolean;
  providerRiskNotes: string[];
}

/**
 * The spec's exact quote shape, preserved literally — everything the engine
 * additionally needs lives under `meta` so these fields are never diluted.
 */
export interface NormalizedBridgeQuote {
  provider: BridgeProviderId;
  routeId: string;
  inputAmount: string;
  platformFeeAmount: string;
  providerFeeAmount: string;
  gasCostUsd: number | null;
  estimatedOutputAmount: string;
  minimumReceived: string;
  estimatedTimeSeconds: number | null;
  priceImpactPercent: number | null;
  approvalTarget?: string;
  transactionRequest?: {
    to: string;
    data: string;
    value: string;
    chainId: number;
  };
  meta: BridgeQuoteMeta;
}

export type BridgeSortMode = "bestReturn" | "fastest" | "lowestCost";

export type BridgeStatusState =
  | "fetching_quote"
  | "approval_required"
  | "waiting_for_signature"
  | "submitted"
  | "bridging"
  | "destination_pending"
  | "completed"
  | "failed"
  | "refund_required"
  | "refunded";

export interface BridgeTransactionStatus {
  state: BridgeStatusState;
  sourceTxHash: string | null;
  sourceExplorerUrl: string | null;
  destinationTxHash: string | null;
  destinationExplorerUrl: string | null;
  providerTrackingUrl: string | null;
  /** Only non-null once the provider reports the destination leg settled. */
  receivedAmount: string | null;
  substatusMessage: string | null;
}

/** The 5-method contract every provider adapter implements identically. */
export interface BridgeAdapter {
  readonly id: BridgeProviderId;
  readonly displayName: string;
  /** Env-key + enable-flag check. Never throws. Mirrors zeroExConfigured(). */
  configured(): boolean;
  /** How this adapter can collect the 1% given current config. */
  feeMode(): FeeCollectionMode;
  getSupportedChains(): Promise<SupportedChain[]>;
  getSupportedTokens(chainId: number): Promise<SupportedToken[]>;
  /** Returns null (never throws) when the provider has no route for this pair — "no route" is not an error. */
  getQuote(params: BridgeQuoteParams): Promise<NormalizedBridgeQuote | null>;
  /** Returns the exact transaction to sign. Does not sign — signing is client-side via wagmi. */
  executeQuote(quote: NormalizedBridgeQuote): {
    to: string;
    data: string;
    value: string;
    chainId: number;
  };
  getTransactionStatus(args: {
    routeId: string;
    txHash: string;
    fromChainId: number;
    toChainId: number;
  }): Promise<BridgeTransactionStatus>;
}
