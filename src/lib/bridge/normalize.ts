import { BRIDGE_QUOTE_TTL_MS } from "@/config/bridgePolicy";
import { safeBigInt } from "./fee";
import { BRIDGE_NATIVE_SENTINEL } from "./types";
import type {
  BridgeQuoteParams,
  BridgeRouteStep,
  NormalizedBridgeQuote,
  SupportedToken,
} from "./types";
import type { LifiQuoteResponse } from "./providers/schemas/lifi";
import type { RelayQuoteResponse } from "./providers/schemas/relay";
import type { AcrossQuoteResponse } from "./providers/schemas/across";

/** Every raw provider address that means "the chain's native asset" collapses to one sentinel app-wide. */
const PROVIDER_NATIVE_ADDRESSES = new Set([
  "0x0000000000000000000000000000000000000000",
  BRIDGE_NATIVE_SENTINEL.toLowerCase(),
]);

export function isNativeAddress(address: string): boolean {
  return PROVIDER_NATIVE_ADDRESSES.has(address.toLowerCase());
}

export function toCanonicalNativeSentinel(address: string): string {
  return isNativeAddress(address) ? BRIDGE_NATIVE_SENTINEL : address;
}

/** Floors an amount by slippageBps when the provider doesn't report a distinct minimum itself. */
function applySlippageFloor(amount: string, slippageBps: number | null): string {
  if (!slippageBps) return amount;
  const value = BigInt(amount);
  // Clamped defensively even though the slippage input UI already caps this
  // (BRIDGE_SLIPPAGE_MAX_BPS) — never let a value above 10000bps flip `kept`
  // negative and produce a negative minimumReceived.
  const kept = 10_000n - BigInt(Math.min(10_000, Math.max(0, slippageBps)));
  return ((value * kept) / 10_000n).toString();
}

function sumAmounts(amounts: Array<string | null | undefined>): string {
  return amounts
    .reduce((total, amount) => total + BigInt(amount && /^\d+$/.test(amount) ? amount : "0"), 0n)
    .toString();
}

function sumUsd(values: Array<string | null | undefined>): number | null {
  const parsed = values
    .map((v) => (v ? Number(v) : null))
    .filter((v): v is number => v !== null && Number.isFinite(v));
  if (parsed.length === 0) return null;
  return parsed.reduce((a, b) => a + b, 0);
}

/** Same guard as sumUsd, for a single USD string — never lets a malformed
 * provider-supplied USD figure become NaN and silently corrupt downstream
 * comparisons (e.g. rank.ts's gasCostUsd tie-break). */
function toFiniteUsd(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export interface NormalizeContext {
  params: BridgeQuoteParams;
  fromToken: SupportedToken;
  toToken: SupportedToken;
  /** The bps actually requested from the provider for this quote — used only to build meta, never to compute platformFeeAmount. */
  feeBps: number;
  quoteTtlMs?: number;
}

function buildMeta(
  ctx: NormalizeContext,
  overrides: Partial<NormalizedBridgeQuote["meta"]>,
): NormalizedBridgeQuote["meta"] {
  const fetchedAt = Date.now();
  return {
    feeMode: "provider-native",
    fetchedAt,
    expiresAt: fetchedAt + (ctx.quoteTtlMs ?? BRIDGE_QUOTE_TTL_MS),
    fromChainId: ctx.params.fromChainId,
    toChainId: ctx.params.toChainId,
    fromToken: ctx.fromToken,
    toToken: ctx.toToken,
    recipientEchoed: null,
    steps: [],
    trackingUrl: null,
    requiresApproval: false,
    providerRiskNotes: [],
    ...overrides,
  };
}

/**
 * LI.FI: platformFeeAmount is read from estimate.feeCosts[]'s per-recipient
 * feeSplit.integratorFee when present — the SDK's authoritative breakdown
 * of RobinPulse's slice, always preferred over guessing from name/
 * description text. Falls back to name/description matching only for a
 * feeCost entry with no feeSplit at all (older API responses). If neither
 * signal is present, platformFeeAmount stays "0" (fee_missing is caught
 * downstream by validateBridgeQuote, never assumed collected).
 * providerFeeAmount sums LI.FI's own cut (feeSplit.lifiFee/intermediaryFee)
 * plus any fee entry that isn't RobinPulse's — always distinct from ours.
 */
export function normalizeLifiQuote(
  raw: LifiQuoteResponse,
  ctx: NormalizeContext,
): NormalizedBridgeQuote {
  const feeCosts = raw.estimate.feeCosts ?? [];
  const gasCosts = raw.estimate.gasCosts ?? [];

  let platformFeeTotal = 0n;
  let providerFeeTotal = 0n;
  // LI.FI's feeCosts entries aren't guaranteed to all share one token (e.g.
  // a gas-token fee alongside an input-token fee) — mixing entries in
  // different tokens into one BigInt sum would silently misreport the fee
  // in whatever unit happens to dominate. Rather than assume a specific
  // token is "correct", the first entry seen establishes the denomination
  // for this quote and any later entry in a different token is excluded
  // from the total instead of guessed at.
  let feeDenomination: string | null = null;
  for (const fee of feeCosts) {
    const feeTokenAddress = toCanonicalNativeSentinel(fee.token.address).toLowerCase();
    if (feeDenomination === null) {
      feeDenomination = feeTokenAddress;
    } else if (feeTokenAddress !== feeDenomination) {
      continue;
    }

    if (fee.feeSplit) {
      platformFeeTotal += safeBigInt(fee.feeSplit.integratorFee) ?? 0n;
      providerFeeTotal +=
        (safeBigInt(fee.feeSplit.lifiFee) ?? 0n) + (safeBigInt(fee.feeSplit.intermediaryFee) ?? 0n);
      continue;
    }
    // `included` describes whether the fee is already netted into the
    // output estimate, not whether it's RobinPulse's — requiring it here
    // misclassified a legitimate on-top integrator fee as a provider fee,
    // which then made checkPlatformFee wrongly report fee_missing.
    const looksLikeIntegratorFee =
      /integrator/i.test(fee.name) || /integrator/i.test(fee.description ?? "");
    const amount = safeBigInt(fee.amount) ?? 0n;
    if (looksLikeIntegratorFee) {
      platformFeeTotal += amount;
    } else {
      providerFeeTotal += amount;
    }
  }

  const steps: BridgeRouteStep[] = (raw.includedSteps ?? [raw]).map((step) => ({
    type: step.type === "swap" ? "swap" : "bridge",
    toolName: step.tool,
    fromChainId: step.action.fromChainId,
    toChainId: step.action.toChainId,
    fromToken: step.action.fromToken,
    toToken: step.action.toToken,
    fromAmount: step.estimate.fromAmount,
    toAmount: step.estimate.toAmount,
    estimatedTimeSeconds: step.estimate.executionDuration ?? null,
  }));

  return {
    provider: "lifi",
    routeId: raw.id ?? `lifi-${ctx.params.fromChainId}-${ctx.params.toChainId}-${Date.now()}`,
    inputAmount: raw.estimate.fromAmount,
    platformFeeAmount: platformFeeTotal.toString(),
    providerFeeAmount: providerFeeTotal.toString(),
    gasCostUsd: sumUsd(gasCosts.map((g) => g.amountUSD)),
    estimatedOutputAmount: raw.estimate.toAmount,
    minimumReceived: raw.estimate.toAmountMin,
    estimatedTimeSeconds: raw.estimate.executionDuration ?? null,
    priceImpactPercent: null,
    approvalTarget: raw.estimate.approvalAddress ?? undefined,
    transactionRequest: raw.transactionRequest
      ? {
          to: raw.transactionRequest.to,
          data: raw.transactionRequest.data,
          value: raw.transactionRequest.value ?? "0",
          chainId: raw.transactionRequest.chainId,
        }
      : undefined,
    meta: buildMeta(ctx, {
      recipientEchoed: raw.action.toAddress ?? null,
      steps,
      requiresApproval: Boolean(raw.estimate.approvalAddress),
    }),
  };
}

/**
 * Relay: platformFeeAmount is read from fees.app — Relay's own App Fee
 * mechanism, only populated when we actually sent an appFees param on the
 * request (i.e. RELAY_APP_FEE_CONFIRMED is true — see relay.server.ts).
 * providerFeeAmount sums Relay's own relayer-side fees, kept distinct from
 * network gas (fees.gas) and from our platform fee.
 *
 * The `details` object this reads currencyIn/currencyOut/recipient/
 * timeEstimate from was NOT confirmed present in Relay's real /quote/v2
 * response during planning (see schemas/relay.ts) — every read is
 * optional-chained with an honest fallback (known request amount, or "0"
 * for an output that can't be determined) rather than a guess, so a
 * missing details object degrades to zero_output validation failure
 * instead of fabricating a number.
 */
export function normalizeRelayQuote(
  raw: RelayQuoteResponse,
  ctx: NormalizeContext,
): NormalizedBridgeQuote {
  const appFee = raw.fees?.app;
  const providerFeeTotal = sumAmounts([
    raw.fees?.relayer?.amount,
    raw.fees?.relayerGas?.amount,
    raw.fees?.relayerService?.amount,
  ]);
  const outputAmount = raw.details?.currencyOut?.amount ?? "0";
  const txItem = raw.steps.flatMap((s) => s.items ?? []).find((item) => item.data);
  const requestId = raw.steps.find((s) => s.requestId)?.requestId;

  const approvalStep = raw.steps.find((s) => /approv/i.test(s.kind ?? s.action ?? ""));

  const steps: BridgeRouteStep[] = raw.steps.map((step) => ({
    type: /swap/i.test(step.kind ?? step.action ?? "") ? "swap" : "bridge",
    toolName: step.kind ?? step.action ?? "Relay",
    fromChainId: ctx.params.fromChainId,
    toChainId: ctx.params.toChainId,
    fromToken: {
      symbol: ctx.fromToken.symbol,
      address: ctx.fromToken.address,
      decimals: ctx.fromToken.decimals,
    },
    toToken: {
      symbol: ctx.toToken.symbol,
      address: ctx.toToken.address,
      decimals: ctx.toToken.decimals,
    },
    fromAmount: raw.details?.currencyIn?.amount ?? "0",
    toAmount: outputAmount,
    estimatedTimeSeconds: raw.details?.timeEstimate ?? null,
  }));

  return {
    provider: "relay",
    routeId: requestId ?? `relay-${ctx.params.fromChainId}-${ctx.params.toChainId}-${Date.now()}`,
    inputAmount: raw.details?.currencyIn?.amount ?? ctx.params.fromAmount,
    platformFeeAmount: appFee?.amount ?? "0",
    providerFeeAmount: providerFeeTotal,
    gasCostUsd: toFiniteUsd(raw.fees?.gas?.amountUsd),
    estimatedOutputAmount: outputAmount,
    minimumReceived: applySlippageFloor(outputAmount, ctx.params.slippageBps),
    estimatedTimeSeconds: raw.details?.timeEstimate ?? null,
    priceImpactPercent: null,
    approvalTarget: approvalStep?.items?.[0]?.data?.to ?? undefined,
    transactionRequest: txItem?.data
      ? {
          to: txItem.data.to,
          data: txItem.data.data,
          value: txItem.data.value ?? "0",
          chainId: txItem.data.chainId,
        }
      : undefined,
    meta: buildMeta(ctx, {
      recipientEchoed: raw.details?.recipient ?? null,
      steps,
      requiresApproval: Boolean(approvalStep),
    }),
  };
}

/**
 * Across: platformFeeAmount is read from fees.total.details.app — Across's
 * own first-class "app fee" slot in their real, confirmed-live response
 * shape (GET /api/swap/approval), only populated when we actually sent
 * app-fee params on the request (ACROSS_APP_FEE_CONFIRMED true — see
 * across.server.ts). providerFeeAmount sums Across's own bridge-side fees
 * (fees.total.details.bridge.details.{lp,relayerCapital,destinationGas}),
 * kept distinct from origin gas and from our platform fee.
 */
export function normalizeAcrossQuote(
  raw: AcrossQuoteResponse,
  ctx: NormalizeContext,
): NormalizedBridgeQuote {
  const details = raw.fees.total.details;
  const bridgeDetails = details?.bridge?.details;
  const appFee = details?.app;
  const providerFeeTotal = sumAmounts([
    bridgeDetails?.lp?.amount,
    bridgeDetails?.relayerCapital?.amount,
    bridgeDetails?.destinationGas?.amount,
  ]);

  const fetchedAt = Date.now();
  const providerExpiresAt = raw.quoteExpiryTimestamp ? raw.quoteExpiryTimestamp * 1000 : undefined;

  const step: BridgeRouteStep = {
    type: "bridge",
    toolName: "Across",
    fromChainId: ctx.params.fromChainId,
    toChainId: ctx.params.toChainId,
    fromToken: {
      symbol: ctx.fromToken.symbol,
      address: ctx.fromToken.address,
      decimals: ctx.fromToken.decimals,
    },
    toToken: {
      symbol: ctx.toToken.symbol,
      address: ctx.toToken.address,
      decimals: ctx.toToken.decimals,
    },
    fromAmount: raw.inputAmount,
    toAmount: raw.expectedOutputAmount,
    estimatedTimeSeconds: raw.expectedFillTime ?? null,
  };

  return {
    provider: "across",
    routeId: raw.id ?? `across-${ctx.params.fromChainId}-${ctx.params.toChainId}-${Date.now()}`,
    inputAmount: raw.inputAmount,
    platformFeeAmount: appFee?.amount ?? "0",
    providerFeeAmount: providerFeeTotal,
    gasCostUsd: toFiniteUsd(raw.originGas?.amountUsd),
    estimatedOutputAmount: raw.expectedOutputAmount,
    minimumReceived:
      raw.minOutputAmount || applySlippageFloor(raw.expectedOutputAmount, ctx.params.slippageBps),
    estimatedTimeSeconds: raw.expectedFillTime ?? null,
    priceImpactPercent: null,
    approvalTarget: raw.approvalTxns?.[0]?.to,
    transactionRequest: raw.swapTx
      ? {
          to: raw.swapTx.to,
          data: raw.swapTx.data,
          value: raw.swapTx.value ?? "0",
          chainId: raw.swapTx.chainId,
        }
      : undefined,
    meta: buildMeta(ctx, {
      steps: [step],
      requiresApproval: Boolean(raw.approvalTxns?.length),
      // Across's own quote expiry, when present, is honored as an earlier
      // ceiling than the app's default TTL — never a later one.
      ...(providerExpiresAt
        ? {
            expiresAt: Math.min(
              providerExpiresAt,
              fetchedAt + (ctx.quoteTtlMs ?? BRIDGE_QUOTE_TTL_MS),
            ),
          }
        : {}),
    }),
  };
}
