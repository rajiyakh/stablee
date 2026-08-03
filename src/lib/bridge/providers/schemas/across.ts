import { z } from "zod";

/**
 * Across Swap API response shapes — confirmed live against a real,
 * unauthenticated GET to app.across.to/api/swap/{chains,tokens,approval}
 * during planning (chain 4663 "Robinhood" present with real WETH/ETH/USDG
 * token entries). Permissive (.passthrough()) per the same rationale as
 * lifi.ts, strict only on fields normalize.ts actually reads.
 */

export const acrossChainSchema = z
  .object({
    chainId: z.number(),
    name: z.string(),
    publicRpcUrl: z.string().nullish(),
    explorerUrl: z.string().nullish(),
    logoUrl: z.string().nullish(),
  })
  .passthrough();

export const acrossChainsResponseSchema = z.array(acrossChainSchema);

export const acrossTokenSchema = z
  .object({
    chainId: z.number(),
    address: z.string(),
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    logoUrl: z.string().nullish(),
    priceUsd: z.union([z.string(), z.number()]).nullish(),
  })
  .passthrough();

export const acrossTokensResponseSchema = z.array(acrossTokenSchema);

const acrossTokenRefSchema = z
  .object({
    chainId: z.number(),
    address: z.string(),
    decimals: z.number(),
    symbol: z.string(),
    name: z.string().optional(),
  })
  .passthrough();

const acrossFeeAmountSchema = z
  .object({
    amount: z.string(),
    amountUsd: z.string().nullish(),
    pct: z.string().nullish(),
    token: acrossTokenRefSchema.optional(),
  })
  .passthrough();

/** GET /api/swap/approval — confirmed live shape. */
export const acrossQuoteResponseSchema = z
  .object({
    id: z.string().optional(),
    inputAmount: z.string(),
    maxInputAmount: z.string().optional(),
    expectedOutputAmount: z.string(),
    minOutputAmount: z.string(),
    expectedFillTime: z.number().nullish(),
    quoteExpiryTimestamp: z.number().nullish(),
    inputToken: acrossTokenRefSchema,
    outputToken: acrossTokenRefSchema,
    fees: z
      .object({
        total: z
          .object({
            amount: z.string(),
            amountUsd: z.string().nullish(),
            details: z
              .object({
                app: acrossFeeAmountSchema.nullish(),
                bridge: z
                  .object({
                    amount: z.string(),
                    amountUsd: z.string().nullish(),
                    details: z
                      .object({
                        lp: acrossFeeAmountSchema.nullish(),
                        relayerCapital: acrossFeeAmountSchema.nullish(),
                        destinationGas: acrossFeeAmountSchema.nullish(),
                      })
                      .partial()
                      .optional(),
                  })
                  .passthrough()
                  .nullish(),
              })
              .partial()
              .optional(),
          })
          .passthrough(),
      })
      .passthrough(),
    originGas: acrossFeeAmountSchema.nullish(),
    approvalTxns: z
      .array(z.object({ to: z.string(), data: z.string(), chainId: z.number() }).passthrough())
      .optional(),
    swapTx: z
      .object({
        to: z.string(),
        data: z.string(),
        value: z.string().nullish(),
        chainId: z.number(),
        simulationSuccess: z.boolean().nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

/**
 * Status-tracking endpoint path/shape was not confirmed live during
 * planning (guessed paths 404'd) — kept permissive, and the adapter treats
 * any failure to fetch/parse status as "submitted, status unavailable"
 * rather than throwing. Verify the real endpoint against Across's
 * dashboard/support before relying on this for production status polling.
 */
export const acrossStatusResponseSchema = z
  .object({
    status: z.string().optional(), // e.g. "pending" | "filled" | "expired" | "refunded"
    fillTx: z.string().nullish(),
    destinationChainId: z.number().nullish(),
  })
  .passthrough();

export type AcrossQuoteResponse = z.infer<typeof acrossQuoteResponseSchema>;
export type AcrossStatusResponse = z.infer<typeof acrossStatusResponseSchema>;
export type AcrossChain = z.infer<typeof acrossChainSchema>;
export type AcrossToken = z.infer<typeof acrossTokenSchema>;
