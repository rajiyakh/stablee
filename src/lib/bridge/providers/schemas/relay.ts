import { z } from "zod";

/**
 * Relay response shapes. Chains confirmed live against api.relay.link/chains
 * during planning (chain 4663 present, key "robinhood", depositEnabled
 * true). The POST /quote/v2 response shape below is the LEAST verified of
 * the three REST adapters — Relay's own docs page did not clearly surface
 * where input/output swap amounts live in the response (only fees + steps
 * were confirmed) despite repeated attempts during planning. Kept
 * deliberately permissive and defensive (multiple fallback field paths in
 * normalize.ts) as a result. Relay is also gated behind
 * RELAY_APP_FEE_CONFIRMED=false by default, so this adapter cannot become
 * fee-bearing/executable until the owner confirms Relay's app-fee
 * mechanism directly with Relay and this schema is verified against a real
 * captured response — see docs/BRIDGE_SETUP.md.
 */

export const relayChainSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    displayName: z.string().optional(),
    explorerUrl: z.string().nullish(),
    currency: z.object({ symbol: z.string(), decimals: z.number() }).partial().optional(),
    depositEnabled: z.boolean().optional(),
  })
  .passthrough();

export const relayChainsResponseSchema = z
  .object({ chains: z.array(relayChainSchema) })
  .passthrough();

/**
 * POST /currencies/v1 — confirmed real endpoint/field names via Relay's
 * docs during planning (groupID, chainId, address, symbol, name, decimals,
 * vmType, metadata.{logoURI,verified,isNative}), but the exact top-level
 * response wrapper (bare array vs grouped array-of-arrays) was not
 * confirmed live (POST-only, couldn't be exercised without a request
 * body). Accepts either shape defensively and the adapter flattens it.
 */
const relayCurrencySchema = z
  .object({
    chainId: z.number(),
    address: z.string(),
    symbol: z.string(),
    name: z.string(),
    decimals: z.number(),
    metadata: z
      .object({ logoURI: z.string().nullish(), isNative: z.boolean().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const relayCurrenciesResponseSchema = z.array(
  z.union([relayCurrencySchema, z.array(relayCurrencySchema)]),
);

const relayCurrencyRefSchema = z
  .object({ chainId: z.number(), address: z.string(), symbol: z.string(), decimals: z.number() })
  .passthrough();

const relayFeeSchema = z
  .object({
    currency: relayCurrencyRefSchema.optional(),
    amount: z.string(),
    amountFormatted: z.string().nullish(),
    amountUsd: z.string().nullish(),
  })
  .passthrough();

const relayTxItemDataSchema = z
  .object({
    to: z.string(),
    data: z.string(),
    value: z.string().nullish(),
    chainId: z.number(),
  })
  .passthrough();

const relayTxItemSchema = z
  .object({
    status: z.string().optional(),
    data: relayTxItemDataSchema.nullish(),
  })
  .passthrough();

const relayStepSchema = z
  .object({
    id: z.string().optional(),
    kind: z.string().optional(),
    action: z.string().optional(),
    description: z.string().nullish(),
    items: z.array(relayTxItemSchema).optional(),
    /** Relay's own execution id — confirmed live in Relay's docs as the identifier
     *  GET /intents/status?requestId= expects. Used as routeId when present so
     *  status polling can use Relay's real id, not a synthetic app-side one. */
    requestId: z.string().nullish(),
  })
  .passthrough();

export const relayQuoteResponseSchema = z
  .object({
    steps: z.array(relayStepSchema),
    fees: z
      .object({
        gas: relayFeeSchema.nullish(),
        relayer: relayFeeSchema.nullish(),
        relayerGas: relayFeeSchema.nullish(),
        relayerService: relayFeeSchema.nullish(),
        app: relayFeeSchema.nullish(),
      })
      .partial()
      .optional(),
    // Not confirmed present in the real v2 response during planning — kept
    // as an optional fallback source for input/output amounts and recipient
    // if Relay's actual schema does include it (older API versions did).
    details: z
      .object({
        currencyIn: z
          .object({ currency: relayCurrencyRefSchema, amount: z.string() })
          .passthrough()
          .optional(),
        currencyOut: z
          .object({ currency: relayCurrencyRefSchema, amount: z.string() })
          .passthrough()
          .optional(),
        recipient: z.string().nullish(),
        timeEstimate: z.number().nullish(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const relayStatusResponseSchema = z
  .object({
    status: z.string(), // "waiting" | "pending" | "success" | "failure" | "refund"
    inTxHashes: z.array(z.string()).optional(),
    txHashes: z.array(z.string()).optional(),
    destinationChainId: z.number().nullish(),
  })
  .passthrough();

export type RelayQuoteResponse = z.infer<typeof relayQuoteResponseSchema>;
export type RelayStatusResponse = z.infer<typeof relayStatusResponseSchema>;
export type RelayChain = z.infer<typeof relayChainSchema>;
