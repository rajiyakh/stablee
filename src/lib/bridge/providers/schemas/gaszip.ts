import { z } from "zod";

/**
 * Gas.zip v2 chains response shape — confirmed live against
 * backend.gas.zip/v2/chains during planning (chain 4663 present, short 526,
 * inbound true, symbol ETH). Gas.zip is a native-token gas-refuel service,
 * not a general ERC-20 bridge — there is no arbitrary-token quote API to
 * schema here; getSupportedTokens() in the adapter honestly reports
 * native-only support from this shape alone.
 */
export const gaszipChainSchema = z
  .object({
    chain: z.number(),
    short: z.number(),
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    inbound: z.boolean(),
    mainnet: z.boolean(),
    rpcs: z.array(z.string()).optional(),
  })
  .passthrough();

export const gaszipChainsResponseSchema = z.array(gaszipChainSchema);

export type GaszipChain = z.infer<typeof gaszipChainSchema>;
