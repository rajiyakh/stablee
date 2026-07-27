import { z } from "zod";

/**
 * Every field is optional/nullable — GMGN's raw response fields are trusted
 * only when present; nothing here is required beyond what's needed to
 * identify the token. This mirrors the app-wide rule: never fabricate a
 * missing value, never assume a field GMGN might omit for a given chain
 * (e.g. `is_honeypot` is documented as BSC/Base-only).
 */
export const gmgnRankItemSchema = z.object({
  chain: z.string().nullish(),
  address: z.string(),
  pair_address: z.string().nullish(),
  dex: z.string().nullish(),

  name: z.string().nullish(),
  symbol: z.string().nullish(),
  logo: z.string().nullish(),

  created_timestamp: z.number().nullish(),

  price: z.number().nullish(),
  market_cap: z.number().nullish(),
  history_highest_marketcap: z.number().nullish(),
  liquidity: z.number().nullish(),

  volume: z.number().nullish(),
  amount: z.number().nullish(),
  swaps: z.number().nullish(),
  buys: z.number().nullish(),
  sells: z.number().nullish(),
  price_change_percent: z.number().nullish(),

  holder_count: z.number().nullish(),
  smart_degen_count: z.number().nullish(),
  renowned_count: z.number().nullish(),
  bot_degen_count: z.number().nullish(),

  gas_fee: z.number().nullish(),

  rug_ratio: z.number().nullish(),
  is_honeypot: z.boolean().nullish(),
  is_wash_trading: z.boolean().nullish(),
  top_10_holder_rate: z.number().nullish(),
  top70_sniper_hold_rate: z.number().nullish(),
  dev_team_hold_rate: z.number().nullish(),
  insider_rate: z.number().nullish(),
  bundler_rate: z.number().nullish(),
  entrapment_ratio: z.number().nullish(),
  renounced_mint: z.boolean().nullish(),
  renounced_freeze_account: z.boolean().nullish(),
  creator_token_status: z.string().nullish(),

  visiting_count: z.number().nullish(),
  rank: z.number().nullish(),

  website: z.string().nullish(),
  twitter: z.string().nullish(),
  telegram: z.string().nullish(),
});

export type GmgnRankItemParsed = z.infer<typeof gmgnRankItemSchema>;

const rankArraySchema = z.array(gmgnRankItemSchema);

/**
 * The exact top-level envelope `gmgn-cli --raw` emits is not fully pinned
 * down from public docs alone (no live successful response was available to
 * inspect while building this). This accepts every plausible shape observed
 * across GMGN's own docs/examples — a bare array, `{ rank: [...] }`, or
 * `{ data: { rank: [...] } }` — and normalizes to a flat array. If GMGN's
 * real shape differs from all three, this throws a clear `ZodError` rather
 * than silently returning nothing.
 */
export const gmgnTrendingResponseSchema = z
  .union([
    rankArraySchema,
    z.object({ rank: rankArraySchema }),
    z.object({ data: z.object({ rank: rankArraySchema }) }),
  ])
  .transform((value): GmgnRankItemParsed[] => {
    if (Array.isArray(value)) return value;
    if ("rank" in value) return value.rank;
    return value.data.rank;
  });

const hotSearchBlockSchema = z.object({
  chain: z.string(),
  interval: z.string(),
  rank: rankArraySchema,
});

/**
 * Hot-searches responses may be a single `(chain, interval)` block (the
 * common case here, since callers always request chain=robinhood) or an
 * array of blocks (when GMGN's default multi-chain behavior is hit). Both
 * are normalized to a flat array of blocks.
 */
export const gmgnHotSearchesResponseSchema = z
  .union([
    z.array(hotSearchBlockSchema),
    hotSearchBlockSchema,
    z.object({ data: z.array(hotSearchBlockSchema) }),
    z.object({ data: hotSearchBlockSchema }),
  ])
  .transform((value) => {
    if (Array.isArray(value)) return value;
    if ("chain" in value) return [value];
    if (Array.isArray(value.data)) return value.data;
    return [value.data];
  });

/** GMGN's structured CLI stderr error line: `HTTP 401 code=401 error=AUTH_KEY_INVALID message=api key invalid` */
export const gmgnCliErrorLineSchema = z.string().regex(/HTTP\s+\d+.*error=\w+.*message=.+/);
