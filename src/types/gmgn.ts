/**
 * GMGN OpenAPI types (client-safe — no server-only imports).
 *
 * Field names on `GmgnRankItem` mirror GMGN's own real API response shape
 * (confirmed via `gmgn-cli`'s own `--help` output and its published skill
 * docs — never guessed). A single `market trending` / `market hot-searches`
 * call is scoped to ONE interval at a time (`--interval`), so the raw item
 * carries generic `volume`/`swaps`/`price_change_percent` fields for whatever
 * interval was requested — `normalize.ts` slots that value into the matching
 * interval-specific field on `RobinhoodTrendingToken` and leaves every other
 * interval's field `undefined`, never a fabricated/guessed value.
 */

export type GmgnChain = "sol" | "bsc" | "base" | "eth" | "robinhood";

export type GmgnInterval = "1m" | "5m" | "1h" | "6h" | "24h";

/** Raw per-token record as returned by GMGN's `/v1/market/rank` and `/v1/market/hot_searches`. */
export interface GmgnRankItem {
  chain: string;
  address: string;
  pair_address?: string | null;
  dex?: string | null;

  name?: string | null;
  symbol?: string | null;
  logo?: string | null;

  created_timestamp?: number | null;

  price?: number | null;
  market_cap?: number | null;
  history_highest_marketcap?: number | null;
  liquidity?: number | null;

  volume?: number | null;
  amount?: number | null;
  swaps?: number | null;
  buys?: number | null;
  sells?: number | null;
  price_change_percent?: number | null;

  holder_count?: number | null;
  smart_degen_count?: number | null;
  renowned_count?: number | null;
  bot_degen_count?: number | null;

  gas_fee?: number | null;

  rug_ratio?: number | null;
  is_honeypot?: boolean | null;
  is_wash_trading?: boolean | null;
  top_10_holder_rate?: number | null;
  top70_sniper_hold_rate?: number | null;
  dev_team_hold_rate?: number | null;
  insider_rate?: number | null;
  bundler_rate?: number | null;
  entrapment_ratio?: number | null;
  renounced_mint?: boolean | null;
  renounced_freeze_account?: boolean | null;
  creator_token_status?: string | null;

  /** Hot-searches only. */
  visiting_count?: number | null;
  rank?: number | null;

  website?: string | null;
  twitter?: string | null;
  telegram?: string | null;
}

export interface GmgnHotSearchBlock {
  chain: string;
  interval: string;
  rank: GmgnRankItem[];
}

export type SecurityFlags = {
  honeypot?: boolean;
  verified?: boolean;
  renounced?: boolean;
  unpaid?: boolean;
  bundledPercent?: number;
  topHolderPercent?: number;
  creatorHoldingPercent?: number;
};

export type ExternalLinks = {
  gmgn?: string;
  dexScreener?: string;
  website?: string;
  x?: string;
  telegram?: string;
};

/** Normalized token shape used throughout the app's Robinhood Mainnet Markets UI. */
export interface RobinhoodTrendingToken {
  rank: number;

  chain: "robinhood";
  address: string;

  name: string;
  symbol: string;
  logoUrl?: string;

  pairAddress?: string;
  dexName?: string;

  createdAt?: string;
  ageSeconds?: number;

  priceUsd?: number;
  marketCapUsd?: number;
  athMarketCapUsd?: number;
  liquidityUsd?: number;

  volume1mUsd?: number;
  volume5mUsd?: number;
  volume1hUsd?: number;
  volume6hUsd?: number;
  volume24hUsd?: number;

  transactions1m?: number;
  transactions5m?: number;
  transactions1h?: number;
  transactions6h?: number;
  transactions24h?: number;

  buys1m?: number;
  sells1m?: number;
  buys1h?: number;
  sells1h?: number;

  holders?: number;
  totalFeesNative?: number;

  priceChange1m?: number;
  priceChange5m?: number;
  priceChange1h?: number;
  priceChange6h?: number;
  priceChange24h?: number;

  visitingCount?: number;
  heatScore?: number;

  security?: SecurityFlags;
  externalLinks?: ExternalLinks;

  provider: "GMGN";
  updatedAt: string;
}

/** Hot-search-specific extension — preserves search rank/heat/interval explicitly. */
export interface RobinhoodHotSearchToken extends RobinhoodTrendingToken {
  searchRank: number;
  searchHeat?: number;
  interval: GmgnInterval;
  providerTimestamp: string;
}
