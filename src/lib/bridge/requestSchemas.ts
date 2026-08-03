import { z } from "zod";
import { BRIDGE_SLIPPAGE_MAX_BPS } from "@/config/bridgePolicy";

const evmAddress = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, "must be a valid EVM address");

/**
 * Request schema for /api/bridge/quote. Deliberately has NO feeBps,
 * treasury, apiKey, to, data, value, or chainIdOverride fields — there is
 * no slot for a client to supply or override any of them, so nothing needs
 * to be "stripped": those values only ever exist inside the .server.ts
 * adapters and feeConfig.server.ts, computed from server config. Mirrors
 * src/lib/swap/requestSchemas.ts's exact rationale.
 */
export const bridgeQuoteRequestSchema = z.object({
  fromChainId: z.coerce.number().int().positive(),
  toChainId: z.coerce.number().int().positive(),
  fromToken: evmAddress,
  toToken: evmAddress,
  fromAmount: z.string().regex(/^\d+$/, "must be a base-unit integer string"),
  sender: evmAddress,
  recipient: evmAddress,
  slippageBps: z.coerce.number().int().min(1).max(BRIDGE_SLIPPAGE_MAX_BPS).optional(),
  sort: z.enum(["bestReturn", "fastest", "lowestCost"]).optional(),
});

export const bridgeTokensRequestSchema = z.object({
  chainId: z.coerce.number().int().positive(),
});

export const bridgeStatusRequestSchema = z.object({
  provider: z.enum(["lifi", "relay", "across", "gaszip"]),
  routeId: z.string().min(1),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "must be a valid transaction hash"),
  fromChainId: z.coerce.number().int().positive(),
  toChainId: z.coerce.number().int().positive(),
});

export type BridgeQuoteRequest = z.infer<typeof bridgeQuoteRequestSchema>;
export type BridgeTokensRequest = z.infer<typeof bridgeTokensRequestSchema>;
export type BridgeStatusRequest = z.infer<typeof bridgeStatusRequestSchema>;
