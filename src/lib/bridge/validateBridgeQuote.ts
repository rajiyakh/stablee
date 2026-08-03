import { BRIDGE_PRICE_IMPACT_MAX_PERCENT } from "@/config/bridgePolicy";
import { checkPlatformFee } from "./fee";
import { isAllowedContract } from "./allowlist";
import type { NormalizedBridgeQuote } from "./types";

/** Nominal brand — a raw NormalizedBridgeQuote cannot be passed where a ValidatedBridgeQuote is expected. */
export type ValidatedBridgeQuote = NormalizedBridgeQuote & { readonly __bridgeValidated: true };

export type BridgeQuoteIssue =
  | { code: "unsupported_chain"; chainId: number }
  | { code: "unsupported_token"; chainId: number; address: string }
  | { code: "chain_mismatch" }
  | { code: "token_mismatch" }
  | { code: "recipient_mismatch" }
  | { code: "missing_transaction" }
  | { code: "untrusted_tx_target"; to: string }
  | { code: "untrusted_approval_target"; target: string }
  | { code: "fee_missing" }
  | { code: "fee_mismatch"; expected: string; actual: string }
  | { code: "fee_mode_unavailable" }
  | { code: "quote_expired"; ageMs: number }
  | { code: "price_impact_severe"; percent: number }
  | { code: "zero_output" };

export type ValidateBridgeQuoteResult =
  { ok: true; quote: ValidatedBridgeQuote } | { ok: false; issues: BridgeQuoteIssue[] };

export interface BridgeQuoteValidationContext {
  expectedFromChainId: number;
  expectedToChainId: number;
  expectedFromToken: string;
  expectedToToken: string;
  expectedRecipient: string;
  expectedFeeBps: number;
  contractAllowlist: Record<number, string[]>;
}

export function validateBridgeQuote(
  quote: NormalizedBridgeQuote,
  ctx: BridgeQuoteValidationContext,
): ValidateBridgeQuoteResult {
  const issues: BridgeQuoteIssue[] = [];

  if (quote.meta.feeMode === "unavailable") {
    issues.push({ code: "fee_mode_unavailable" });
  }

  if (quote.meta.fromChainId !== ctx.expectedFromChainId) {
    issues.push({ code: "chain_mismatch" });
  }
  if (quote.transactionRequest && quote.transactionRequest.chainId !== ctx.expectedFromChainId) {
    issues.push({ code: "chain_mismatch" });
  }

  if (
    quote.meta.fromToken.address.toLowerCase() !== ctx.expectedFromToken.toLowerCase() ||
    quote.meta.toToken.address.toLowerCase() !== ctx.expectedToToken.toLowerCase()
  ) {
    issues.push({ code: "token_mismatch" });
  }

  if (
    quote.meta.recipientEchoed !== null &&
    quote.meta.recipientEchoed.toLowerCase() !== ctx.expectedRecipient.toLowerCase()
  ) {
    issues.push({ code: "recipient_mismatch" });
  }

  if (!quote.transactionRequest || !quote.transactionRequest.to || !quote.transactionRequest.data) {
    issues.push({ code: "missing_transaction" });
  }

  if (
    quote.transactionRequest &&
    !isAllowedContract(
      ctx.contractAllowlist,
      quote.transactionRequest.chainId,
      quote.transactionRequest.to,
    )
  ) {
    issues.push({ code: "untrusted_tx_target", to: quote.transactionRequest.to });
  }

  if (
    quote.approvalTarget &&
    !isAllowedContract(ctx.contractAllowlist, ctx.expectedFromChainId, quote.approvalTarget)
  ) {
    issues.push({ code: "untrusted_approval_target", target: quote.approvalTarget });
  }

  if (quote.meta.feeMode === "provider-native") {
    const feeCheck = checkPlatformFee(quote, ctx.expectedFeeBps);
    if (feeCheck) issues.push(feeCheck);
  }

  const ageMs = Date.now() - quote.meta.fetchedAt;
  if (Date.now() > quote.meta.expiresAt) {
    issues.push({ code: "quote_expired", ageMs });
  }

  if (
    quote.priceImpactPercent !== null &&
    quote.priceImpactPercent >= BRIDGE_PRICE_IMPACT_MAX_PERCENT
  ) {
    issues.push({ code: "price_impact_severe", percent: quote.priceImpactPercent });
  }

  if (BigInt(quote.estimatedOutputAmount || "0") === 0n) {
    issues.push({ code: "zero_output" });
  }

  if (issues.length > 0) return { ok: false, issues };

  return { ok: true, quote: quote as ValidatedBridgeQuote };
}
