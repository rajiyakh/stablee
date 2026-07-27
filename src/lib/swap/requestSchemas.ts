import { z } from "zod";
import { SLIPPAGE_MAX_BPS } from "@/config/swapPolicy";

const evmAddress = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, "must be a valid EVM address");

const baseAmountSwapFields = z.object({
  sellToken: evmAddress,
  buyToken: evmAddress,
  sellAmount: z.string().regex(/^\d+$/, "must be a base-unit integer string").optional(),
  buyAmount: z.string().regex(/^\d+$/, "must be a base-unit integer string").optional(),
  slippageBps: z.coerce.number().int().min(1).max(SLIPPAGE_MAX_BPS).optional(),
});

/**
 * Request schemas for /api/swap/price and /api/swap/quote. Deliberately have
 * NO chainId, swapFeeRecipient, swapFeeBps, swapFeeToken, or API-key fields
 * — there is no slot for a client to supply or override any of them, so
 * nothing needs to be "stripped": those four values only ever exist inside
 * zeroEx.server.ts, computed from server config.
 */
export const swapPriceRequestSchema = baseAmountSwapFields
  .extend({
    taker: evmAddress.optional(),
  })
  .refine((v) => Boolean(v.sellAmount) !== Boolean(v.buyAmount), {
    message: "exactly one of sellAmount or buyAmount is required",
  });

export const swapQuoteRequestSchema = baseAmountSwapFields
  .extend({
    taker: evmAddress,
  })
  .refine((v) => Boolean(v.sellAmount) !== Boolean(v.buyAmount), {
    message: "exactly one of sellAmount or buyAmount is required",
  });

export type SwapPriceRequest = z.infer<typeof swapPriceRequestSchema>;
export type SwapQuoteRequest = z.infer<typeof swapQuoteRequestSchema>;
