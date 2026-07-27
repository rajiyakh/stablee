import { z } from "zod";

/**
 * Every field is optional/nullable — GMGN's raw response fields are trusted
 * only when present; nothing here is required beyond what's needed to
 * identify the token. Field names below were corrected against a real,
 * live `gmgn-cli market trending --chain robinhood` response (a real
 * GMGN_API_KEY became available after this was first built defensively
 * from docs alone) — several field names and types differed from the
 * documented guesses:
 *  - `is_honeypot` is a number (0/1), not a boolean.
 *  - the real timestamp field is `creation_timestamp`, not `created_timestamp`.
 *  - the real ATH field is `history_highest_market_cap` (extra underscore),
 *    not `history_highest_marketcap`.
 *  - the real Twitter field is `twitter_username`, not `twitter`.
 *  - `is_renounced`/`is_open_source` (numbers, 0/1) are real fields not
 *    previously known, and are more reliably populated for Robinhood than
 *    `renounced_mint`/`renounced_freeze_account` (observed always null).
 */
export const gmgnRankItemSchema = z.object({
  chain: z.string().nullish(),
  address: z.string(),
  pair_address: z.string().nullish(),
  dex: z.string().nullish(),
  launchpad_platform: z.string().nullish(),

  name: z.string().nullish(),
  symbol: z.string().nullish(),
  logo: z.string().nullish(),

  creation_timestamp: z.number().nullish(),

  price: z.number().nullish(),
  market_cap: z.number().nullish(),
  history_highest_market_cap: z.number().nullish(),
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
  is_honeypot: z.union([z.boolean(), z.number()]).nullish(),
  is_wash_trading: z.boolean().nullish(),
  is_renounced: z.union([z.boolean(), z.number()]).nullish(),
  is_open_source: z.union([z.boolean(), z.number()]).nullish(),
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
  twitter_username: z.string().nullish(),
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

/**
 * The real field holding the token array is `tokens`, confirmed against a
 * live `gmgn-cli market hot-searches --chain robinhood` response — not
 * `rank` as originally guessed from docs alone (trending uses `rank`,
 * hot-searches uses `tokens`; the two endpoints do not share a field name
 * here). The real top-level shape is a bare array of blocks, e.g.
 * `[{ interval, chain, version, tokens: [...] }]`.
 */
const hotSearchBlockSchema = z.object({
  chain: z.string(),
  interval: z.string(),
  tokens: rankArraySchema,
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
