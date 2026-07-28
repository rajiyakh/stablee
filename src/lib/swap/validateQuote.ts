import { PRICE_IMPACT_MAX_BPS } from "@/config/swapPolicy";
import type { ZeroExPriceResponse, ZeroExQuoteResponse } from "./schemas";

export interface QuoteValidationContext {
  expectedSellToken: string;
  expectedBuyToken: string;
  /** Epoch ms when the response was fetched — the API has no expiry field, so this is app-side. */
  fetchedAt: number;
  quoteTtlMs: number;
  /** true for /api/swap/quote (transaction required); false for /api/swap/price (indicative only). */
  requireTransaction: boolean;
  /** Computed via computePriceImpactBps() from two independently-resolved USD values — null when unverifiable. */
  priceImpactBps: number | null;
}

export type QuoteValidationIssue =
  | { code: "no_liquidity" }
  | { code: "missing_amounts" }
  | { code: "missing_transaction" }
  | { code: "token_mismatch" }
  | { code: "balance_issue" }
  | { code: "simulation_incomplete" }
  | { code: "fee_missing" }
  | { code: "quote_expired"; ageMs: number }
  | { code: "price_impact_severe"; bps: number };

/** Nominal brand — a raw ZeroExQuoteResponse cannot be passed where a ValidatedQuote is expected; only this function's success branch produces one. */
export type ValidatedQuote<T> = T & { readonly __validated: true };

export type ValidateQuoteResult<T> =
  { ok: true; quote: ValidatedQuote<T> } | { ok: false; issues: QuoteValidationIssue[] };

export function validateQuote<T extends ZeroExPriceResponse | ZeroExQuoteResponse>(
  response: T,
  ctx: QuoteValidationContext,
): ValidateQuoteResult<T> {
  if (!response.liquidityAvailable) {
    return { ok: false, issues: [{ code: "no_liquidity" }] };
  }

  const issues: QuoteValidationIssue[] = [];

  if (!response.buyAmount || !response.sellAmount) {
    issues.push({ code: "missing_amounts" });
  }

  if (
    response.sellToken.toLowerCase() !== ctx.expectedSellToken.toLowerCase() ||
    response.buyToken.toLowerCase() !== ctx.expectedBuyToken.toLowerCase()
  ) {
    issues.push({ code: "token_mismatch" });
  }

  if (ctx.requireTransaction) {
    const tx = "transaction" in response ? response.transaction : undefined;
    if (!tx || !tx.to || !tx.data || tx.value === undefined) {
      issues.push({ code: "missing_transaction" });
    }
  }

  if (response.issues?.balance) {
    issues.push({ code: "balance_issue" });
  }

  if (response.issues?.simulationIncomplete) {
    issues.push({ code: "simulation_incomplete" });
  }

  const integratorFee = response.fees?.integratorFee;
  const hasFeeAmount = Boolean(integratorFee?.amount) && BigInt(integratorFee?.amount ?? "0") > 0n;
  if (!hasFeeAmount) {
    issues.push({ code: "fee_missing" });
  }

  const ageMs = Date.now() - ctx.fetchedAt;
  if (ageMs > ctx.quoteTtlMs) {
    issues.push({ code: "quote_expired", ageMs });
  }

  // Price impact ≥3% is blocked by default (no override control is offered
  // in the UI, so this is a hard block, not just a warning) — computed
  // server-side, never left to the client to self-report or bypass.
  if (ctx.priceImpactBps !== null && ctx.priceImpactBps >= PRICE_IMPACT_MAX_BPS) {
    issues.push({ code: "price_impact_severe", bps: ctx.priceImpactBps });
  }

  if (issues.length > 0) return { ok: false, issues };

  return { ok: true, quote: response as ValidatedQuote<T> };
}
