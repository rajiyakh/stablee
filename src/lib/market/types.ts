/** Shared market data types (client-safe, no server imports). */

export type ProviderId =
  "coingecko" | "dexscreener" | "geckoterminal" | "gmgn" | "zeroex" | "verified" | "blockscout";

export type ProviderState = "live" | "delayed" | "unavailable" | "not_configured";

export interface ApiEnvelope<T> {
  data: T | null;
  provider: ProviderId;
  fetchedAt: string | null;
  stale: boolean;
  cached: boolean;
  error: { code: string; message: string } | null;
  attribution: string;
}

export interface ProviderStatus {
  id: ProviderId | "robinhood";
  label: string;
  state: ProviderState;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  features: string[];
  attribution: string;
  detail?: string;
}

export interface TxCounts {
  buys: number | null;
  sells: number | null;
}

/** Normalised DEX pair, shaped from real DEX Screener / GeckoTerminal fields. */
export interface DexMarket {
  source: "dexscreener" | "geckoterminal";
  chainId: string;
  dexId: string | null;
  pairAddress: string;
  url: string | null;
  baseToken: { address: string; name: string | null; symbol: string | null };
  quoteToken: { address: string | null; name: string | null; symbol: string | null };
  priceUsd: number | null;
  priceNative: number | null;
  priceChange: {
    m5: number | null;
    h1: number | null;
    h6: number | null;
    h24: number | null;
  };
  volume: { m5: number | null; h1: number | null; h6: number | null; h24: number | null };
  txns: { m5: TxCounts; h1: TxCounts; h6: TxCounts; h24: TxCounts };
  liquidityUsd: number | null;
  fdv: number | null;
  marketCap: number | null;
  pairCreatedAt: number | null;
  imageUrl: string | null;
  headerUrl: string | null;
  websites: Array<{ label: string; url: string }>;
  socials: Array<{ type: string; url: string }>;
  boostAmount: number | null;
}

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  currentPrice: number | null;
  marketCap: number | null;
  marketCapRank: number | null;
  totalVolume: number | null;
  priceChangePercentage24h: number | null;
  lastUpdated: string | null;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string | null;
  marketCapRank: number | null;
  score: number | null;
  priceUsd: number | null;
  priceChangePercentage24h: number | null;
}

export interface ChartPoint {
  t: number;
  price: number;
}

export interface OhlcvPoint {
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type RiskFlag =
  | "limited_data"
  | "low_liquidity"
  | "extremely_low_liquidity"
  | "high_volatility"
  | "new_pair"
  | "buy_sell_imbalance"
  | "promotional_boost"
  | "suspicious_volume"
  | "verification_unavailable"
  | "sudden_liquidity_decline"
  | "data_provider_disagreement"
  | "incomplete_market_data";

export const RISK_FLAG_LABELS: Record<RiskFlag, string> = {
  limited_data: "Limited data",
  low_liquidity: "Low liquidity",
  extremely_low_liquidity: "Extremely low liquidity",
  high_volatility: "High volatility",
  new_pair: "Newly created pair",
  buy_sell_imbalance: "Unusual buy/sell imbalance",
  promotional_boost: "Promotional boost detected",
  suspicious_volume: "Unusual volume",
  verification_unavailable: "Contract verification unavailable",
  sudden_liquidity_decline: "Sudden liquidity decline",
  data_provider_disagreement: "Data provider disagreement",
  incomplete_market_data: "Incomplete market data",
};

export interface ScoredMarket {
  market: DexMarket;
  trendScore: number | null;
  components: Record<string, number | null>;
  risks: RiskFlag[];
}
