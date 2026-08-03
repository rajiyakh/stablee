import { z } from "zod";

/**
 * LI.FI response shapes are large and evolve — these schemas are
 * deliberately permissive (.passthrough() on outer objects) and strict only
 * on the fields normalize.ts actually reads, matching the same discipline
 * src/lib/swap/schemas.ts uses for 0x's responses. Captured from LI.FI's
 * publicly documented /v1/chains, /v1/tokens and /v1/quote shapes.
 */

export const lifiChainSchema = z
  .object({
    id: z.number(),
    key: z.string(),
    name: z.string(),
    mainnet: z.boolean().optional(),
    nativeToken: z.object({ symbol: z.string(), decimals: z.number() }),
    metamask: z
      .object({ blockExplorerUrls: z.array(z.string()).optional() })
      .partial()
      .optional(),
  })
  .passthrough();

export const lifiChainsResponseSchema = z
  .object({ chains: z.array(lifiChainSchema) })
  .passthrough();

export const lifiTokenSchema = z
  .object({
    address: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    chainId: z.number(),
    name: z.string(),
    logoURI: z.string().nullish(),
    priceUSD: z.string().nullish(),
  })
  .passthrough();

export const lifiTokensResponseSchema = z
  .object({ tokens: z.record(z.string(), z.array(lifiTokenSchema)) })
  .passthrough();

const lifiFeeCostSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    token: z.object({ address: z.string(), symbol: z.string(), decimals: z.number() }),
    amount: z.string(),
    amountUSD: z.string().nullish(),
    percentage: z.string().optional(),
    included: z.boolean().optional(),
    // The SDK's authoritative per-recipient breakdown of this FeeCost — used
    // in preference to name/description matching whenever present, since it
    // directly identifies RobinPulse's slice rather than inferring it from text.
    feeSplit: z
      .object({
        lifiFee: z.string().optional(),
        integratorFee: z.string().optional(),
        intermediaryFee: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const lifiGasCostSchema = z
  .object({
    amount: z.string(),
    amountUSD: z.string().nullish(),
    token: z.object({ symbol: z.string(), decimals: z.number() }),
  })
  .passthrough();

const lifiTokenRefSchema = z
  .object({
    address: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    chainId: z.number(),
    name: z.string(),
    logoURI: z.string().nullish(),
    priceUSD: z.string().nullish(),
  })
  .passthrough();

const lifiStepSchema = z
  .object({
    type: z.string(),
    tool: z.string(),
    action: z
      .object({
        fromChainId: z.number(),
        toChainId: z.number(),
        fromToken: lifiTokenRefSchema,
        toToken: lifiTokenRefSchema,
        fromAmount: z.string(),
        toAddress: z.string().optional(),
      })
      .passthrough(),
    estimate: z
      .object({
        fromAmount: z.string(),
        toAmount: z.string(),
        toAmountMin: z.string(),
        approvalAddress: z.string().nullish(),
        feeCosts: z.array(lifiFeeCostSchema).optional(),
        gasCosts: z.array(lifiGasCostSchema).optional(),
        executionDuration: z.number().nullish(),
      })
      .passthrough(),
  })
  .passthrough();

export const lifiQuoteResponseSchema = z
  .object({
    id: z.string().optional(),
    type: z.string().optional(),
    tool: z.string(),
    action: lifiStepSchema.shape.action,
    estimate: lifiStepSchema.shape.estimate,
    transactionRequest: z
      .object({
        to: z.string(),
        data: z.string(),
        value: z.string().nullish(),
        chainId: z.number(),
      })
      .passthrough()
      .nullish(),
    includedSteps: z.array(lifiStepSchema).optional(),
  })
  .passthrough();

export const lifiStatusResponseSchema = z
  .object({
    status: z.string(), // "NOT_FOUND" | "INVALID" | "PENDING" | "DONE" | "FAILED"
    substatus: z.string().nullish(),
    substatusMessage: z.string().nullish(),
    sending: z
      .object({ txHash: z.string().nullish(), chainId: z.number().nullish() })
      .partial()
      .optional(),
    receiving: z
      .object({
        txHash: z.string().nullish(),
        chainId: z.number().nullish(),
        amount: z.string().nullish(),
      })
      .partial()
      .optional(),
    lifiExplorerLink: z.string().nullish(),
  })
  .passthrough();

export type LifiQuoteResponse = z.infer<typeof lifiQuoteResponseSchema>;
export type LifiStatusResponse = z.infer<typeof lifiStatusResponseSchema>;
export type LifiChain = z.infer<typeof lifiChainSchema>;
export type LifiToken = z.infer<typeof lifiTokenSchema>;
