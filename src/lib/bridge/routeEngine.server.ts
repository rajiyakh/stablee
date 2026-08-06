import { MAX_ROUTES_RETURNED } from "@/config/bridgePolicy";
import { adaptersSupportingRoute } from "./registry.server";
import { bridgeFeeBps, bridgeTreasuryAddress } from "./feeConfig.server";
import { rankRoutes } from "./rank";
import { validateBridgeQuote } from "./validateBridgeQuote";
import { parseContractAllowlist } from "./allowlist";
import type { BridgeQuoteParams, BridgeSortMode, NormalizedBridgeQuote } from "./types";

export interface ExcludedRoute {
  provider: string;
  reason: string;
}

export interface RouteEngineResult {
  routes: NormalizedBridgeQuote[];
  excluded: ExcludedRoute[];
  feeBps: number;
  sortApplied: BridgeSortMode;
}

/**
 * The core aggregation loop: query every fee-bearing, route-supporting
 * adapter concurrently, validate each quote (including the double-fee
 * gate), rank the survivors, and report why anything was excluded rather
 * than silently dropping it. One provider failing never blocks the others.
 */
export async function fetchBridgeRoutes(
  params: BridgeQuoteParams,
  sort: BridgeSortMode = "bestReturn",
): Promise<RouteEngineResult> {
  const treasury = bridgeTreasuryAddress();
  if (!treasury) {
    throw new Error(
      "fetchBridgeRoutes called without a configured treasury address — check bridgeTreasuryAddress() first.",
    );
  }

  const feeBps = bridgeFeeBps();
  const excluded: ExcludedRoute[] = [];

  const checks = await adaptersSupportingRoute(params);
  const supportedAdapters = checks.filter((c) => c.supported);
  for (const check of checks) {
    if (!check.supported) {
      excluded.push({ provider: check.adapter.id, reason: check.reason ?? "not supported" });
    }
  }

  const settled = await Promise.allSettled(
    supportedAdapters.map((check) => check.adapter.getQuote(params)),
  );

  const validationContext = {
    expectedFromChainId: params.fromChainId,
    expectedToChainId: params.toChainId,
    expectedFromToken: params.fromToken,
    expectedToToken: params.toToken,
    expectedFromAmount: params.fromAmount,
    expectedRecipient: params.recipient,
    expectedFeeBps: feeBps,
    contractAllowlist: parseContractAllowlist(process.env.BRIDGE_CONTRACT_ALLOWLIST),
  };

  const validated: NormalizedBridgeQuote[] = [];

  settled.forEach((result, index) => {
    const provider = supportedAdapters[index].adapter.id;

    if (result.status === "rejected") {
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error(`[bridge] ${provider} quote request rejected:`, reason);
      excluded.push({ provider, reason: "quote request failed" });
      return;
    }
    if (result.value === null) {
      excluded.push({ provider, reason: "no route for this pair" });
      return;
    }

    // A single malformed quote (e.g. a non-numeric amount string from the
    // provider) must only exclude that one route, never take down the whole
    // request and discard every other provider's valid routes with it.
    try {
      const validation = validateBridgeQuote(result.value, validationContext);
      if (!validation.ok) {
        excluded.push({ provider, reason: validation.issues.map((i) => i.code).join(", ") });
        return;
      }
      validated.push(validation.quote);
    } catch (error) {
      console.error(`[bridge] ${provider} quote failed validation unexpectedly:`, error);
      excluded.push({ provider, reason: "quote validation failed" });
    }
  });

  const ranked = rankRoutes(validated, sort).slice(0, MAX_ROUTES_RETURNED);

  return { routes: ranked, excluded, feeBps, sortApplied: sort };
}
