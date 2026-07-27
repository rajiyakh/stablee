import { z } from "zod";

/**
 * Zod schemas for 0x Swap API v2 AllowanceHolder responses (confirmed exact
 * shape via docs.0x.org this session). Every field the app doesn't strictly
 * need to trust is left optional/nullable rather than assumed present.
 *
 * Every address that later feeds a security-relevant decision — approve()
 * spender, sendTransaction() target, fee token, sell/buy token — is shape-
 * validated as a real EVM address here, so a malformed or unexpected value
 * in any of these fields fails loudly at the Zod-parse boundary (caught by
 * the route handler's try/catch) instead of silently reaching a signing
 * call downstream.
 */

const evmAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "expected a valid EVM address");

const feeEntrySchema = z.object({
  amount: z.string(),
  token: evmAddress,
  type: z.string(),
});

const feesSchema = z.object({
  integratorFee: feeEntrySchema.nullable().optional(),
  integratorFees: z.array(feeEntrySchema).nullable().optional(),
  zeroExFee: feeEntrySchema.nullable().optional(),
  gasFee: feeEntrySchema.nullable().optional(),
});

const allowanceIssueSchema = z.object({
  actual: z.string(),
  spender: evmAddress,
});

const balanceIssueSchema = z.object({
  token: evmAddress,
  actual: z.string(),
  expected: z.string(),
});

const issuesSchema = z.object({
  allowance: allowanceIssueSchema.nullable().optional(),
  balance: balanceIssueSchema.nullable().optional(),
  simulationIncomplete: z.boolean().optional(),
  invalidSourcesPassed: z.array(z.string()).optional(),
});

const routeFillSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  source: z.string().optional(),
  proportionBps: z.string().optional(),
});

const routeSchema = z.object({
  fills: z.array(routeFillSchema).optional(),
  tokens: z.array(z.object({ address: z.string(), symbol: z.string() })).optional(),
});

const tokenTaxSchema = z.object({
  buyTaxBps: z.string().nullable().optional(),
  sellTaxBps: z.string().nullable().optional(),
  transferTaxBps: z.string().nullable().optional(),
});

const transactionSchema = z.object({
  to: evmAddress,
  data: z.string().regex(/^0x[a-fA-F0-9]*$/, "expected hex calldata"),
  gas: z.string().nullable().optional(),
  gasPrice: z.string().nullable().optional(),
  value: z.string(),
});

const noLiquiditySchema = z.object({
  liquidityAvailable: z.literal(false),
  zid: z.string().optional(),
});

const baseQuoteFields = z.object({
  liquidityAvailable: z.literal(true),
  blockNumber: z.string().optional(),
  buyAmount: z.string(),
  buyToken: evmAddress,
  sellAmount: z.string(),
  sellToken: evmAddress,
  minBuyAmount: z.string().optional(),
  zid: z.string().optional(),
  fees: feesSchema.optional(),
  issues: issuesSchema.optional(),
  route: routeSchema.optional(),
  tokenMetadata: z
    .object({ buyToken: tokenTaxSchema.optional(), sellToken: tokenTaxSchema.optional() })
    .optional(),
  totalNetworkFee: z.string().nullable().optional(),
  mode: z.string().optional(),
});

/** Price endpoint — same fields, never a `transaction`. */
export const zeroExPriceResponseSchema = z.union([baseQuoteFields, noLiquiditySchema]);

/** Quote endpoint — same as price plus a required `transaction` when liquidity is available. */
export const zeroExQuoteResponseSchema = z.union([
  baseQuoteFields.extend({ transaction: transactionSchema }),
  noLiquiditySchema,
]);

export type ZeroExPriceResponse = z.infer<typeof zeroExPriceResponseSchema>;
export type ZeroExQuoteResponse = z.infer<typeof zeroExQuoteResponseSchema>;
